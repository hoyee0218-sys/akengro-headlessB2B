import type {
  PredictiveSearchQuery,
} from 'storefrontapi.generated';
import type {SearchProductConnection} from '~/lib/search-page';

type SearchContentNodes<T> = {nodes: T[]};

export type RegularSearchItems = {
  products: SearchProductConnection;
  articles: SearchContentNodes<{
    __typename?: string;
    handle: string;
    id: string;
    title: string;
    trackingParameters?: string | null;
  }>;
  pages: SearchContentNodes<{
    __typename?: string;
    handle: string;
    id: string;
    title: string;
    trackingParameters?: string | null;
  }>;
};

type ResultWithItems<Type extends 'predictive' | 'regular', Items> = {
  type: Type;
  term: string;
  error?: string;
  result: {total: number; items: Items; hasFilters?: boolean} | null;
};

export type RegularSearchReturn = ResultWithItems<'regular', RegularSearchItems>;
export type PredictiveSearchReturn = ResultWithItems<
  'predictive',
  NonNullable<PredictiveSearchQuery['predictiveSearch']>
>;

/**
 * Returns the empty state of a predictive search result to reset the search state.
 */
export function getEmptyPredictiveSearchResult(): NonNullable<
  PredictiveSearchReturn['result']
> {
  return {
    total: 0,
    items: {
      articles: [],
      collections: [],
      products: [],
      pages: [],
      queries: [],
    },
  };
}

interface UrlWithTrackingParams {
  /** The base URL to which the tracking parameters will be appended. */
  baseUrl: string;
  /** The trackingParams returned by the Storefront API. */
  trackingParams?: string | null;
  /** Any additional query parameters to be appended to the URL. */
  params?: Record<string, string>;
  /** The search term to be appended to the URL. */
  term: string;
}

/**
 * A utility function that appends tracking parameters to a URL. Tracking parameters are
 * used internally by Shopify to enhance search results and admin dashboards.
 */
export function urlWithTrackingParams({
  baseUrl,
  trackingParams,
  params: extraParams,
  term,
}: UrlWithTrackingParams) {
  let search = new URLSearchParams({
    ...extraParams,
    q: encodeURIComponent(term),
  }).toString();

  if (trackingParams) {
    search = `${search}&${trackingParams}`;
  }

  return `${baseUrl}?${search}`;
}
