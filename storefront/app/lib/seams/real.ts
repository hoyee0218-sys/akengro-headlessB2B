/* ===========================================================================
   REAL PROVIDERS (BUILD.md §5/§9 — INTEGRATION_MODE=real)
   ---------------------------------------------------------------------------
   Pricing (§4.3) is live via SparkLayer REST. Remaining providers still throw
   NotImplemented naming the OWNER until their phase is filled in.
   ======================================================================== */
import {merchantConfig} from '~/merchant.config';
import {NotImplemented, resolveRealEntitlementsForUser} from '../entitlement';
import {
  fetchEntitledTiersForSku,
  fetchStorefrontMultiplierForLists,
  isSparkApiConfigured,
  type SparkApiConfig,
  type SparkPriceTier,
} from '../spark-api';
import {
  gatedPrice,
  resolvedPriceFromSpark,
  tiersToPriceBreaks,
  unitPriceFromTiers,
} from '../spark-pricing';
import type {
  AccountDataProvider,
  CatalogProvider,
  CustomerContext,
  EntitlementProvider,
  OrderProvider,
  PricingProvider,
  ResolvedPrice,
  ShopifyAuthedUser,
} from './types';

const SPARKLAYER = 'SparkLayer (B2B pricing / quotes / cart)';
const SHOPIFY_IDENTITY = 'Shopify Customer Account API (identity → company)';
const SHOPIFY_STOREFRONT = 'Shopify Storefront API (catalog content / SEO)';
const SHOPIFY_ADMIN = 'Shopify Admin/Orders API (+ ERP→SparkLayer sync)';

export type RealPricingEnv = {
  PUBLIC_SPARKLAYER_SITE_ID?: string;
  SPARKLAYER_CLIENT_ID?: string;
  SPARKLAYER_CLIENT_SECRET?: string;
  /** Override API host (default https://app.sparklayer.io; use test.app for sandbox). */
  SPARKLAYER_API_BASE?: string;
};

function sparkApiConfigFromEnv(
  env: RealPricingEnv | undefined,
  fetchImpl?: typeof fetch,
): SparkApiConfig | null {
  const siteId =
    env?.PUBLIC_SPARKLAYER_SITE_ID?.trim() ||
    merchantConfig.sparkLayer.siteId;
  const config = {
    siteId,
    clientId: env?.SPARKLAYER_CLIENT_ID?.trim() ?? '',
    clientSecret: env?.SPARKLAYER_CLIENT_SECRET?.trim() ?? '',
    apiBase: env?.SPARKLAYER_API_BASE?.trim(),
    fetchImpl,
  };
  return isSparkApiConfigured(config) ? config : null;
}

/**
 * BASELINE §4.3: Spark price-list API keyed by entitlement priceListIds + SKU.
 * Loads each entitled list once (cached), then looks up SKUs — avoids PLP
 * connection storms that caused "Network connection lost".
 * Automatic lists with no SKU rows use Spark list rules × Storefront Money.
 */
export function createRealPricingProvider(
  env?: RealPricingEnv,
  options?: {fetchImpl?: typeof fetch; currency?: string},
): PricingProvider {
  const currency = options?.currency ?? merchantConfig.currency;
  const api = sparkApiConfigFromEnv(env, options?.fetchImpl);

  /** Per-provider in-flight SKU lookups (price + breaks share one call). */
  const skuInflight = new Map<string, Promise<SparkPriceTier[] | null>>();
  let multiplierPromise: Promise<number | null> | null = null;
  let emptyListWarned = false;

  async function loadEntitledTiers(
    sku: string,
    ctx: CustomerContext,
  ): Promise<SparkPriceTier[] | null> {
    if (!api) return null;
    const key = `${ctx.priceListIds.join(',')}|${sku.trim().toLowerCase()}`;
    const existing = skuInflight.get(key);
    if (existing) return existing;

    const promise = fetchEntitledTiersForSku(
      api,
      sku,
      ctx.priceListIds,
    ).finally(() => {
      skuInflight.delete(key);
    });
    skuInflight.set(key, promise);
    return promise;
  }

  async function loadMultiplier(ctx: CustomerContext): Promise<number | null> {
    if (!api) return null;
    if (!multiplierPromise) {
      multiplierPromise = fetchStorefrontMultiplierForLists(
        api,
        ctx.priceListIds,
      ).catch((error) => {
        console.warn('[pricing] Could not load Spark list automatic rule', error);
        return null;
      });
    }
    return multiplierPromise;
  }

  return {
    async getPriceForCustomer(
      productId: string,
      ctx: CustomerContext | null,
    ): Promise<ResolvedPrice> {
      if (!ctx) return gatedPrice(currency);
      if (!api) {
        console.warn(
          '[pricing] Spark API credentials missing — set SPARKLAYER_CLIENT_ID and SPARKLAYER_CLIENT_SECRET',
        );
        return gatedPrice(currency);
      }
      if (!ctx.priceListIds.length) {
        console.warn(
          '[pricing] Customer has no sparklayer.price_lists — cannot scope prices safely.',
          {customerId: ctx.customerId},
        );
        return gatedPrice(currency);
      }

      const tiers = await loadEntitledTiers(productId, ctx);
      if (tiers) {
        return resolvedPriceFromSpark({
          amount: unitPriceFromTiers(tiers),
          currency,
        });
      }

      const storefrontMultiplier = await loadMultiplier(ctx);
      if (!emptyListWarned) {
        emptyListWarned = true;
        console.warn(
          '[pricing] Spark list has no materialized SKU rows; using automatic rule × Storefront when available',
          {
            priceListIds: ctx.priceListIds,
            storefrontMultiplier,
          },
        );
      }

      return resolvedPriceFromSpark({
        amount: null,
        currency,
        storefrontMultiplier,
      });
    },

    async getQuantityBreaks(variantId: string, ctx: CustomerContext | null) {
      if (!ctx || !api || !ctx.priceListIds.length) return [];
      const tiers = await loadEntitledTiers(variantId, ctx);
      if (!tiers) return [];
      return tiersToPriceBreaks(tiers);
    },
  };
}

/** @deprecated Prefer createRealPricingProvider(env) — kept for import sites. */
export const realPricingProvider: PricingProvider = createRealPricingProvider();

/**
 * BASELINE §4.1: B2B verification (tag + Spark metafield) is live.
 * Price lists come from sparklayer.price_lists on the authed user (§4.3).
 */
export const realEntitlementProvider: EntitlementProvider = {
  async resolveEntitlements(user: ShopifyAuthedUser) {
    return resolveRealEntitlementsForUser(user);
  },
};

export const realCatalogProvider: CatalogProvider = {
  async getProducts() {
    throw new NotImplemented(SHOPIFY_STOREFRONT, 'collection(handle){ products } query');
  },
  async getProduct() {
    throw new NotImplemented(SHOPIFY_STOREFRONT, 'product(handle) query');
  },
  async getCategories() {
    throw new NotImplemented(SHOPIFY_STOREFRONT, 'collections query');
  },
};

export const realOrderProvider: OrderProvider = {
  async createOrder() {
    throw new NotImplemented(SHOPIFY_ADMIN, 'order create via Admin/Orders API');
  },
  async syncOrderToSparkLayer() {
    throw new NotImplemented(SHOPIFY_ADMIN, 'apply b2b tag + import metafield to SparkLayer');
  },
};

export const realAccountDataProvider: AccountDataProvider = {
  async getOrderHistory() {
    throw new NotImplemented(SPARKLAYER, 'order history for company');
  },
  async getOrder() {
    throw new NotImplemented(SPARKLAYER, 'order detail');
  },
  async getQuotes() {
    throw new NotImplemented(SPARKLAYER, 'quotes for company');
  },
  async getQuote() {
    throw new NotImplemented(SPARKLAYER, 'quote detail');
  },
  async getQuoteLines() {
    throw new NotImplemented(SPARKLAYER, 'quote line items');
  },
  async getCredit() {
    throw new NotImplemented(SPARKLAYER, 'credit limit / balance');
  },
  async getReorderHistory() {
    throw new NotImplemented(SPARKLAYER, 'reorder history aggregation');
  },
  async getSavedLists() {
    throw new NotImplemented(SPARKLAYER, 'saved lists / order templates');
  },
  async getUsers() {
    throw new NotImplemented(SHOPIFY_IDENTITY, 'company contacts / users');
  },
  async getRoles() {
    throw new NotImplemented(SHOPIFY_IDENTITY, 'company contact roles');
  },
  async getApprovals() {
    throw new NotImplemented(SPARKLAYER, 'approval queue');
  },
  async getNotifications() {
    throw new NotImplemented(SPARKLAYER, 'notifications / back-in-stock');
  },
  async getStockWatch() {
    throw new NotImplemented(SPARKLAYER, 'back-in-stock subscriptions');
  },
  async getShipToAddresses() {
    throw new NotImplemented(SHOPIFY_IDENTITY, 'company ship-to locations');
  },
  async getCostCenters() {
    throw new NotImplemented(SPARKLAYER, 'cost centers');
  },
};
