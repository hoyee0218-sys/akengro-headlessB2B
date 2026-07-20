/* Search page loaders (BASELINE-BUILD §3.3).
   Products from Storefront `search` + S&D `productFilters`; prices via PricingProvider. */
import type {ProductFilter} from '@shopify/hydrogen/storefront-api-types';
import type {CustomerContext, Seams} from '~/lib/seams/types';
import {
  overlayPricesOnCollectionProducts,
  type CollectionProductNode,
} from '~/lib/collection-page';
import type {StorefrontListProduct} from '~/lib/product-page';
import type {CollectionFilter} from '~/lib/collection-filters';

type StorefrontClient = {
  query: (query: string, options?: Record<string, unknown>) => Promise<any>;
  CacheNone?: () => unknown;
  CacheShort?: () => unknown;
  CacheLong?: () => unknown;
};

export type SearchProductConnection = {
  nodes: StorefrontListProduct[];
  pageInfo: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    startCursor?: string | null;
    endCursor?: string | null;
  };
  filters: CollectionFilter[];
  totalCount: number | null;
};

/** Map S&D search productFilters into the shared CollectionFilter shape. */
export function mapSearchProductFilters(
  filters: Array<{
    id?: string | null;
    label?: string | null;
    type?: string | null;
    values?: Array<{
      id?: string | null;
      label?: string | null;
      count?: number | null;
      input?: unknown;
    }> | null;
  }> | null | undefined,
): CollectionFilter[] {
  return (filters ?? [])
    .filter((filter) => Boolean(filter?.id && filter?.label))
    .map((filter) => ({
      id: String(filter.id),
      label: String(filter.label),
      type: String(filter.type || 'LIST'),
      values: (filter.values ?? [])
        .filter((value) => Boolean(value?.id))
        .map((value) => ({
          id: String(value.id),
          label: String(value.label ?? ''),
          count: typeof value.count === 'number' ? value.count : 0,
          input: value.input,
        })),
    }));
}

/** Load priced product search results + S&D facets for `/search`. */
export async function loadSearchProducts(
  storefront: StorefrontClient,
  seams: Seams,
  ctx: CustomerContext | null,
  options: {
    term: string;
    productFilters: ProductFilter[];
    first?: number;
    last?: number;
    startCursor?: string | null;
    endCursor?: string | null;
  },
): Promise<SearchProductConnection> {
  const term = options.term.trim();
  if (!term) {
    return {
      nodes: [],
      pageInfo: {
        hasNextPage: false,
        hasPreviousPage: false,
        startCursor: null,
        endCursor: null,
      },
      filters: [],
      totalCount: 0,
    };
  }

  const data = await storefront.query(SEARCH_PRODUCTS_QUERY, {
    variables: {
      term,
      productFilters: options.productFilters.length
        ? options.productFilters
        : undefined,
      first: options.first,
      last: options.last,
      startCursor: options.startCursor,
      endCursor: options.endCursor,
    },
    cache: storefront.CacheShort?.() ?? storefront.CacheLong?.(),
  });

  const products = data?.products;
  const rawNodes = (products?.nodes ?? []) as CollectionProductNode[];
  const priced = await overlayPricesOnCollectionProducts(rawNodes, seams, ctx);

  return {
    nodes: priced,
    pageInfo: {
      hasNextPage: Boolean(products?.pageInfo?.hasNextPage),
      hasPreviousPage: Boolean(products?.pageInfo?.hasPreviousPage),
      startCursor: products?.pageInfo?.startCursor ?? null,
      endCursor: products?.pageInfo?.endCursor ?? null,
    },
    filters: mapSearchProductFilters(products?.productFilters),
    totalCount:
      typeof products?.totalCount === 'number' ? products.totalCount : null,
  };
}

export const SEARCH_PRODUCTS_QUERY = `#graphql
  query SearchProducts(
    $country: CountryCode
    $language: LanguageCode
    $term: String!
    $productFilters: [ProductFilter!]
    $first: Int
    $last: Int
    $startCursor: String
    $endCursor: String
  ) @inContext(country: $country, language: $language) {
    products: search(
      query: $term
      types: [PRODUCT]
      productFilters: $productFilters
      sortKey: RELEVANCE
      unavailableProducts: HIDE
      first: $first
      last: $last
      before: $startCursor
      after: $endCursor
    ) {
      totalCount
      productFilters {
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
        ... on Product {
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
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
    }
  }
` as const;
