/* ===========================================================================
   MOCK PROVIDERS (BUILD.md §5/§7 — INTEGRATION_MODE=mock)
   ---------------------------------------------------------------------------
   Realistic demo data served from fixtures.ts. Everything returned here is
   flagged demo:true so the UI shows a DemoDataBadge on the surface. These run
   in loaders/actions only.
   ======================================================================== */
import * as F from './fixtures';
import {resolveEntitlementsForUser} from '../entitlement';
import type {
  AccountDataProvider,
  CartInput,
  CatalogProvider,
  CatalogProduct,
  CreatedOrder,
  CustomerContext,
  Entitlements,
  EntitlementProvider,
  OrderProvider,
  PriceBreak,
  PricingProvider,
  ResolvedPrice,
  ShopifyAuthedUser,
} from './types';
import {merchantConfig} from '~/merchant.config';

/* ---- Entitlement bridge (delegates to the tested core) ------------------- */
export const mockEntitlementProvider: EntitlementProvider = {
  async resolveEntitlements(user: ShopifyAuthedUser): Promise<Entitlements> {
    return resolveEntitlementsForUser(user);
  },
};

/** Build the per-request CustomerContext from resolved entitlements + the
 *  (mock) company record. In real mode the company fields come from the
 *  Customer Account API / SparkLayer, not fixtures. */
export function mockCustomerContext(
  user: ShopifyAuthedUser,
  ent: Entitlements,
): CustomerContext {
  const c = F.company;
  return {
    customerId: user.customerId,
    email: user.email,
    companyId: ent.companyId,
    companyName: c.name,
    orgnr: c.orgnr,
    priceListIds: ent.priceListIds,
    priceListLabel: c.priceList,
    terms: c.terms,
    permissions: ent.permissions,
    credit: {...c.credit},
    demo: true,
  };
}

/* ---- Pricing ------------------------------------------------------------- */
export const mockPricingProvider: PricingProvider = {
  async getPriceForCustomer(
    productId: string,
    ctx: CustomerContext | null,
  ): Promise<ResolvedPrice> {
    // Gate: no entitlement context (logged out / non-entitled) → no price.
    if (!ctx) {
      return {amount: null, listAmount: null, currency: merchantConfig.currency, gated: true, demo: true};
    }
    const p = F.products.find((x) => x.id === productId || x.sku === productId);
    // Unmatched Storefront SKUs: leave amount null so the route can overlay
    // the variant's Storefront Money (price / compareAtPrice). Do not invent
    // a uniform fallback — that made every product look like 249 / 299.
    if (!p) {
      return {
        amount: null,
        listAmount: null,
        currency: merchantConfig.currency,
        gated: false,
        demo: true,
      };
    }
    return {
      amount: p.amount,
      // Only expose list when it is a real markdown vs the customer price.
      listAmount: p.listAmount > p.amount ? p.listAmount : null,
      currency: merchantConfig.currency,
      gated: false,
      demo: true,
    };
  },

  async getQuantityBreaks(
    variantId: string,
    ctx: CustomerContext | null,
  ): Promise<PriceBreak[]> {
    if (!ctx) return [];
    const p = F.products.find((x) => x.id === variantId || x.sku === variantId);
    // No invented breaks for unmatched Storefront variants.
    if (!p) return [];
    return p.breaks;
  },
};

/* ---- Catalog (content) --------------------------------------------------- */
export const mockCatalogProvider: CatalogProvider = {
  async getProducts(): Promise<CatalogProduct[]> {
    return F.products;
  },
  async getProduct(id: string): Promise<CatalogProduct | null> {
    return F.products.find((p) => p.id === id || p.sku === id) || null;
  },
  async getCategories(): Promise<string[]> {
    return F.categories;
  },
};

/* ---- Orders / checkout handoff (STUBBED — BUILD.md §8) ------------------- */
export const mockOrderProvider: OrderProvider = {
  async createOrder(_cart: CartInput, _ctx: CustomerContext): Promise<CreatedOrder> {
    // In production this calls the Shopify Admin/Orders API and returns the real
    // order id. Mock returns the fixed demo order id used by the success screen.
    return {platformOrderId: 'NO-104890', sparkCartId: 'spark-cart-demo', demo: true};
  },
  async syncOrderToSparkLayer(_order: CreatedOrder): Promise<void> {
    // Real: apply the `b2b` order tag + import metafield per SparkLayer's pattern.
    return;
  },
};

/* ---- Account data ("Mine sider") ----------------------------------------- */
export const mockAccountDataProvider: AccountDataProvider = {
  async getOrderHistory() {
    return F.orders;
  },
  async getOrder(id: string) {
    return F.orders.find((o) => o.id === id) || null;
  },
  async getQuotes() {
    return F.quotes;
  },
  async getQuote(id: string) {
    return F.quotes.find((q) => q.id === id) || null;
  },
  async getQuoteLines(id: string) {
    return F.quoteLines[id] || [];
  },
  async getCredit() {
    return {...F.company.credit};
  },
  async getReorderHistory() {
    return F.reorderHistory;
  },
  async getSavedLists() {
    return F.savedLists;
  },
  async getUsers() {
    return F.users;
  },
  async getRoles() {
    return F.roles;
  },
  async getApprovals() {
    return F.approvals;
  },
  async getNotifications() {
    return F.notifications;
  },
  async getStockWatch() {
    return F.backInStockWatch;
  },
  async getShipToAddresses() {
    return F.shipTo;
  },
  async getCostCenters() {
    return F.costCenters;
  },
};
