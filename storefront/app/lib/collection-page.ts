import type {CustomerContext, Seams} from '~/lib/seams/types';
import {
  getPriceForCustomerSafe,
  getQuantityBreaksSafe,
} from '~/lib/seams';
import {
  overlayPriceWithStorefront,
  type StorefrontListProduct,
} from '~/lib/product-page';
import {variantStockStatus} from '~/lib/product-stock';

type StorefrontMoney = {
  amount: string;
  currencyCode: string;
} | null | undefined;

export type CollectionProductNode = {
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
};

/** Overlay PricingProvider prices onto collection product nodes for ProductCard. */
export async function overlayPricesOnCollectionProducts(
  nodes: CollectionProductNode[],
  seams: Seams,
  ctx: CustomerContext | null,
): Promise<StorefrontListProduct[]> {
  return Promise.all(
    nodes.map(async (product) => {
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

export const COLLECTION_QUERY = `#graphql
  query Collection(
    $handle: String!
    $country: CountryCode
    $language: LanguageCode
    $filters: [ProductFilter!]
    $sortKey: ProductCollectionSortKeys
    $reverse: Boolean
    $first: Int
    $last: Int
    $startCursor: String
    $endCursor: String
  ) @inContext(country: $country, language: $language) {
    collection(handle: $handle) {
      id
      title
      handle
      description
      seo {
        title
        description
      }
      products(
        first: $first
        last: $last
        before: $startCursor
        after: $endCursor
        filters: $filters
        sortKey: $sortKey
        reverse: $reverse
      ) {
        filters {
          id
          label
          type
          values {
            id
            label
            count
            input
          }
        }
        nodes {
          ...CollectionProductCard
        }
        pageInfo {
          hasNextPage
          hasPreviousPage
          startCursor
          endCursor
        }
      }
    }
  }
  fragment CollectionProductCard on Product {
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
    }
  }
` as const;
