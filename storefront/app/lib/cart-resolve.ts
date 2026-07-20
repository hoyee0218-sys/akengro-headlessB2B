/* Resolve session cart lines into checkout/mini-cart display rows.
   Prefer the add-time snapshot, then catalog (id/sku), then Shopify lookup.
   Never drop a line — unmatched keys still render with a fallback title. */
import {formatVariantTitle, type B2BCartLine} from '~/lib/cart';
import type {CatalogProduct} from '~/lib/seams/types';

export type ResolvedCartLine = {
  id: string;
  title: string;
  sku: string;
  amount: number;
  qty: number;
  currency?: string;
  handle?: string;
  imageUrl?: string | null;
  variantTitle?: string;
};

type StorefrontClient = {
  query: (query: string, options?: Record<string, unknown>) => Promise<any>;
  CacheLong?: () => unknown;
  CacheNone?: () => unknown;
};

function catalogMatch(
  line: B2BCartLine,
  products: CatalogProduct[],
): CatalogProduct | undefined {
  const key = line.productId.trim().toLowerCase();
  const skuKey = (line.sku || '').trim().toLowerCase();
  return products.find((product) => {
    const id = product.id.toLowerCase();
    const sku = product.sku.toLowerCase();
    return (
      id === key ||
      sku === key ||
      (skuKey && (id === skuKey || sku === skuKey))
    );
  });
}

function fromSnapshot(line: B2BCartLine): ResolvedCartLine | null {
  if (!line.title || line.amount == null || Number.isNaN(line.amount)) {
    return null;
  }
  return {
    id: line.productId,
    title: line.title,
    sku: line.sku || line.productId,
    amount: line.amount,
    qty: line.qty,
    currency: line.currency,
    handle: line.handle,
    imageUrl: line.imageUrl,
    variantTitle: line.variantTitle,
  };
}

function fromCatalog(
  line: B2BCartLine,
  product: CatalogProduct,
): ResolvedCartLine {
  return {
    id: line.productId,
    title: product.title,
    sku: product.sku,
    amount: product.amount,
    qty: line.qty,
    handle: line.handle,
    imageUrl: line.imageUrl,
    variantTitle: line.variantTitle,
  };
}

function fallback(line: B2BCartLine): ResolvedCartLine {
  return {
    id: line.productId,
    title: line.title || line.productId,
    sku: line.sku || line.productId,
    amount: line.amount ?? 0,
    qty: line.qty,
    currency: line.currency,
    handle: line.handle,
    imageUrl: line.imageUrl,
    variantTitle: line.variantTitle,
  };
}

async function lookupShopify(
  storefront: StorefrontClient,
  line: B2BCartLine,
): Promise<ResolvedCartLine | null> {
  const handle = line.handle || (!line.productId.includes(':') ? line.productId : '');
  const sku = line.sku || line.productId;
  const query = handle
    ? `handle:${handle}`
    : sku
      ? `sku:${sku}`
      : '';
  if (!query) return null;

  try {
    const data = await storefront.query(CART_RESOLVE_PRODUCTS_QUERY, {
      variables: {query, first: 5},
      cache: storefront.CacheLong?.() ?? storefront.CacheNone?.(),
    });
    const products = data?.products?.nodes ?? [];
    for (const product of products) {
      const variants = product.variants?.nodes ?? [];
      const variant =
        variants.find(
          (node: {sku?: string | null}) =>
            (node.sku || '').toLowerCase() === sku.toLowerCase(),
        ) ||
        variants[0] ||
        null;
      if (!variant && !product.title) continue;
      const amount = Number(variant?.price?.amount);
      return {
        id: line.productId,
        title: product.title || line.productId,
        sku: variant?.sku || sku,
        amount: Number.isFinite(amount) ? amount : (line.amount ?? 0),
        qty: line.qty,
        currency: variant?.price?.currencyCode,
        handle: product.handle || line.handle,
        imageUrl:
          variant?.image?.url || product.featuredImage?.url || line.imageUrl,
        variantTitle:
          line.variantTitle ||
          formatVariantTitle(variant?.selectedOptions) ||
          undefined,
      };
    }
  } catch {
    return null;
  }
  return null;
}

/** Map session cart → display lines for checkout / mini-cart. */
export async function resolveCartLines(
  cart: B2BCartLine[],
  catalog: CatalogProduct[],
  storefront?: StorefrontClient | null,
): Promise<ResolvedCartLine[]> {
  const resolved: ResolvedCartLine[] = [];

  for (const line of cart) {
    const snap = fromSnapshot(line);
    if (snap) {
      resolved.push(snap);
      continue;
    }

    const catalogProduct = catalogMatch(line, catalog);
    if (catalogProduct) {
      resolved.push(fromCatalog(line, catalogProduct));
      continue;
    }

    if (storefront) {
      const shopify = await lookupShopify(storefront, line);
      if (shopify) {
        resolved.push(shopify);
        continue;
      }
    }

    resolved.push(fallback(line));
  }

  return resolved;
}

export const CART_RESOLVE_PRODUCTS_QUERY = `#graphql
  query CartResolveProducts(
    $country: CountryCode
    $language: LanguageCode
    $query: String!
    $first: Int!
  ) @inContext(country: $country, language: $language) {
    products(first: $first, query: $query) {
      nodes {
        handle
        title
        featuredImage {
          url
        }
        variants(first: 50) {
          nodes {
            sku
            title
            selectedOptions {
              name
              value
            }
            price {
              amount
              currencyCode
            }
            image {
              url
            }
          }
        }
      }
    }
  }
` as const;
