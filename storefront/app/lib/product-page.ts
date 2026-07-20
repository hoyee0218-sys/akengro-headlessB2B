import {getSelectedProductOptions} from '@shopify/hydrogen';
import type {StockStatus} from '~/components/ds/StockIndicator';
import type {CustomerContext, PriceBreak, ResolvedPrice, Seams} from '~/lib/seams/types';
import {
  getPriceForCustomerSafe,
  getQuantityBreaksSafe,
} from '~/lib/seams';
import {variantStockStatus} from '~/lib/product-stock';
import {applyStorefrontMultiplier} from '~/lib/spark-pricing';

export {variantStockStatus} from '~/lib/product-stock';
export {
  isOptionValueInStock,
  isOptionValueSelectable,
} from '~/lib/product-stock';

type StorefrontClient = {
  query: (
    query: string,
    options?: {variables?: Record<string, unknown>},
  ) => Promise<any>;
};

type StorefrontMoney = {
  amount: string;
  currencyCode: string;
} | null | undefined;

export type StorefrontPricedVariant = {
  price?: StorefrontMoney;
  compareAtPrice?: StorefrontMoney;
} | null | undefined;

export type StorefrontListProduct = {
  handle: string;
  title: string;
  vendor: string;
  productType: string;
  imageUrl: string | null;
  sku: string;
  stock: StockStatus;
  price: ResolvedPrice;
  breaks: PriceBreak[];
};

/** Variables for the Storefront `product(handle:)` query. */
export function productQueryVariables(handle: string, request: Request) {
  return {
    handle,
    selectedOptions: getSelectedProductOptions(request),
  };
}

function parseMoneyAmount(money: StorefrontMoney): number | null {
  if (!money?.amount) return null;
  const value = Number(money.amount);
  return Number.isFinite(value) ? value : null;
}

/**
 * Map Storefront variant Money → ResolvedPrice.
 * listAmount mirrors Admin "Compare-at price" whenever it is a real markdown
 * (positive and different from selling price). Compare-at of 0 is treated as unset.
 */
export function resolvedPriceFromStorefrontVariant(
  variant: StorefrontPricedVariant,
  demo = true,
): ResolvedPrice | null {
  const amount = parseMoneyAmount(variant?.price);
  if (amount == null || !variant?.price) return null;

  const compareAt = parseMoneyAmount(variant.compareAtPrice);
  const listAmount =
    compareAt != null && compareAt > 0 && compareAt !== amount
      ? compareAt
      : null;

  return {
    amount,
    listAmount,
    currency: variant.price.currencyCode,
    gated: false,
    demo,
  };
}

/**
 * Seam overlay for customer price.
 * - Selling price: PricingProvider (fixtures / Spark) when set, else Storefront `price`.
 * - Automatic Spark lists: `storefrontMultiplier` × Storefront (origin shown as list).
 * - List / compare-at: Admin compare-at only when meaningful (> 0); otherwise the
 *   pre-discount Shopify amount when a multiplier was applied.
 */
export function overlayPriceWithStorefront(
  seamPrice: ResolvedPrice,
  variant: StorefrontPricedVariant,
): ResolvedPrice {
  if (seamPrice.gated) return seamPrice;

  const storefront = resolvedPriceFromStorefrontVariant(variant, seamPrice.demo);
  let amount = seamPrice.amount;
  let listFromMultiplier: number | null = null;

  if (
    amount == null &&
    storefront?.amount != null &&
    seamPrice.storefrontMultiplier != null &&
    Number.isFinite(seamPrice.storefrontMultiplier)
  ) {
    const adjusted = applyStorefrontMultiplier(
      storefront.amount,
      seamPrice.storefrontMultiplier,
    );
    amount = adjusted.amount;
    listFromMultiplier = adjusted.listAmount;
  }

  amount = amount ?? storefront?.amount ?? null;
  if (amount == null) {
    return seamPrice;
  }

  const currency =
    seamPrice.amount != null || seamPrice.storefrontMultiplier != null
      ? seamPrice.currency
      : (storefront?.currency ?? seamPrice.currency);

  // Prefer Spark origin (multiplier list) over a bogus Admin compare-at of 0.
  const storefrontList =
    storefront?.listAmount != null &&
    storefront.listAmount > 0 &&
    storefront.listAmount !== amount
      ? storefront.listAmount
      : null;
  const seamList =
    seamPrice.listAmount != null &&
    seamPrice.listAmount > 0 &&
    seamPrice.listAmount !== amount
      ? seamPrice.listAmount
      : null;
  const multiplierList =
    listFromMultiplier != null &&
    listFromMultiplier > 0 &&
    listFromMultiplier !== amount
      ? listFromMultiplier
      : null;

  return {
    amount,
    listAmount: multiplierList ?? storefrontList ?? seamList,
    currency,
    gated: false,
    demo: seamPrice.demo,
    // Keep so PDP can re-overlay when the shopper changes Size/Color.
    storefrontMultiplier: seamPrice.storefrontMultiplier ?? null,
  };
}

/** Overlay PricingProvider prices onto Storefront product listing cards. */
export async function getPricedStorefrontProducts(
  storefront: StorefrontClient,
  seams: Seams,
  ctx: CustomerContext | null,
  opts?: {first?: number; query?: string},
): Promise<StorefrontListProduct[]> {
  const {products} = await storefront.query(PRODUCTS_LIST_QUERY, {
    variables: {
      first: opts?.first ?? 24,
      query: opts?.query ?? null,
    },
  });

  const nodes = products?.nodes ?? [];

  return Promise.all(
    nodes.map(async (product: {
      handle: string;
      title: string;
      vendor?: string | null;
      productType?: string | null;
      featuredImage?: {url?: string | null} | null;
      selectedOrFirstAvailableVariant?: {
        sku?: string | null;
        availableForSale?: boolean | null;
        image?: {url?: string | null} | null;
        price?: StorefrontMoney;
        compareAtPrice?: StorefrontMoney;
      } | null;
    }) => {
      const variant = product.selectedOrFirstAvailableVariant;
      const pricingKey = variant?.sku || product.handle;
      const [seamPrice, breaks] = await Promise.all([
        getPriceForCustomerSafe(seams, pricingKey, ctx),
        getQuantityBreaksSafe(seams, pricingKey, ctx),
      ]);

      return {
        handle: product.handle,
        title: product.title,
        vendor: product.vendor ?? '',
        productType: product.productType ?? '',
        imageUrl: variant?.image?.url ?? product.featuredImage?.url ?? null,
        sku: variant?.sku || product.handle,
        stock: variantStockStatus(variant),
        price: overlayPriceWithStorefront(seamPrice, variant),
        breaks,
      };
    }),
  );
}

const PRODUCTS_LIST_QUERY = `#graphql
  query ProductsList($country: CountryCode, $language: LanguageCode, $first: Int!, $query: String)
  @inContext(country: $country, language: $language) {
    products(first: $first, query: $query) {
      nodes {
        handle
        title
        vendor
        productType
        featuredImage {
          url
          altText
          width
          height
        }
        selectedOrFirstAvailableVariant(
          selectedOptions: []
          ignoreUnknownOptions: true
          caseInsensitiveMatch: true
        ) {
          id
          sku
          title
          availableForSale
          price {
            amount
            currencyCode
          }
          compareAtPrice {
            amount
            currencyCode
          }
          image {
            url
            altText
            width
            height
          }
          selectedOptions {
            name
            value
          }
        }
      }
    }
  }
` as const;
