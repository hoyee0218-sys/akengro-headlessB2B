/* Search (BASELINE-BUILD §3.3). Storefront search + predictiveSearch against
   the real shop; S&D productFilters drive the same type-driven facet UI as PLP;
   product results use ProductCard with PricingProvider overlay. */
import type {ComponentProps} from 'react';
import {Link, useLoaderData, useLocation} from 'react-router';
import type {ProductFilter} from '@shopify/hydrogen/storefront-api-types';
import {Analytics, getPaginationVariables} from '@shopify/hydrogen';
import type {Route} from './+types/search';
import type {PredictiveSearchQuery} from 'storefrontapi.generated';
import {resolveAuthedUser} from '~/lib/auth';
import {getCustomerContext, getSeams} from '~/lib/seams';
import {
  getAppliedProductFilters,
  resolveCollectionProductCount,
} from '~/lib/collection-filters';
import {productPath} from '~/lib/format';
import {
  getEmptyPredictiveSearchResult,
  type PredictiveSearchReturn,
  type RegularSearchReturn,
} from '~/lib/search';
import {loadSearchProducts} from '~/lib/search-page';
import type {StorefrontListProduct} from '~/lib/product-page';
import {merchantConfig} from '~/merchant.config';
import {t} from '~/lib/copy';
import {Icon} from '~/components/ds/Icon';
import {ProductCard} from '~/components/ds/ProductCard';
import {SearchForm} from '~/components/SearchForm';
import {SearchResults} from '~/components/SearchResults';
import {CollectionPlpShell} from '~/components/CollectionPlpShell';
import {CollectionEmptyState} from '~/components/CollectionEmptyState';
import {PaginatedResourceSection} from '~/components/PaginatedResourceSection';
import {useQuickAdd} from '~/components/QuickAddModal';

type SearchLoaderResult = RegularSearchReturn | PredictiveSearchReturn;

export const meta: Route.MetaFunction = ({data}) => {
  const term =
    data && typeof data === 'object' && 'term' in data
      ? String((data as {term?: string}).term || '')
      : '';
  const title = term
    ? t('search.metaTitleWithTerm', {term})
    : t('search.metaTitle');
  return [{title: `${title} — ${merchantConfig.merchantName}`}];
};

export async function loader({request, context}: Route.LoaderArgs) {
  const url = new URL(request.url);
  const isPredictive = url.searchParams.has('predictive');

  try {
    return isPredictive
      ? await predictiveSearch({request, context})
      : await regularSearch({request, context});
  } catch (error) {
    console.error(error);
    return {
      type: 'regular' as const,
      term: String(url.searchParams.get('q') || ''),
      error: error instanceof Error ? error.message : String(error),
      result: {
        total: 0,
        items: {
          products: {
            nodes: [],
            pageInfo: {
              hasNextPage: false,
              hasPreviousPage: false,
              startCursor: null,
              endCursor: null,
            },
            filters: [],
            totalCount: 0,
          },
          articles: {nodes: []},
          pages: {nodes: []},
        },
        hasFilters: false,
      },
    } satisfies SearchLoaderResult;
  }
}

export default function SearchPage() {
  const data = useLoaderData<typeof loader>();
  if (data.type === 'predictive') return null;

  const {term, result, error} = data;
  const {openQuickAdd} = useQuickAdd();
  const location = useLocation();
  const hasFilters =
    Boolean(result?.hasFilters) ||
    getAppliedProductFilters(new URLSearchParams(location.search)).length > 0;

  const products = result?.items?.products;
  const filters = products?.filters ?? [];
  const productNodes = (products?.nodes ?? []) as StorefrontListProduct[];

  return (
    <main>
      <div className="sf__wrap">
        <div className="sf-crumb">
          <Link to="/">{t('nav.home')}</Link>{' '}
          <Icon name="chevron-right" size={13} />{' '}
          <span>{t('search.title')}</span>
        </div>

        <div className="sf-search-page">
          <div className="sf-search-page__form">
            <SearchForm action="/search">
              {({inputRef}) => (
                <input
                  className="dsInput__el"
                  defaultValue={term}
                  name="q"
                  placeholder={t('chrome.searchPlaceholder')}
                  ref={inputRef}
                  type="search"
                  aria-label={t('search.title')}
                />
              )}
            </SearchForm>
          </div>

          {error ? (
            <p className="sf-search-page__error" role="alert">
              {error}
            </p>
          ) : null}

          {!term ? (
            <p className="sf-search-page__hint">{t('search.prompt')}</p>
          ) : (
            <CollectionPlpShell
              title={t('search.resultsTitle', {term})}
              productCount={
                typeof products?.totalCount === 'number'
                  ? {value: products.totalCount, isLowerBound: false}
                  : resolveCollectionProductCount({
                      facetFilters: filters,
                      pageNodeCount: productNodes.length,
                      hasNextPage: products?.pageInfo?.hasNextPage,
                      hasPreviousPage: products?.pageInfo?.hasPreviousPage,
                    })
              }
              hasFilters={hasFilters}
              filters={filters}
              showSort={false}
            >
              {productNodes.length === 0 ? (
                <CollectionEmptyState hasFilters={hasFilters} />
              ) : (
                <PaginatedResourceSection<StorefrontListProduct>
                  connection={
                    products as ComponentProps<
                      typeof PaginatedResourceSection<StorefrontListProduct>
                    >['connection']
                  }
                  resourcesClassName="sf-plp__grid"
                  ariaLabel={t('search.productsAria')}
                >
                  {({node: product}) => (
                    <ProductCard
                      key={product.handle}
                      title={product.title}
                      sku={product.sku}
                      image={product.imageUrl}
                      amount={product.price.amount}
                      listAmount={product.price.listAmount}
                      currency={product.price.currency}
                      gated={product.price.gated}
                      stockStatus={product.stock}
                      href={productPath(product.handle)}
                      onAddToCart={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (product.price.gated || product.stock === 'out') {
                          return;
                        }
                        openQuickAdd(product.handle);
                      }}
                    />
                  )}
                </PaginatedResourceSection>
              )}
            </CollectionPlpShell>
          )}

          {term && result?.total ? (
            <SearchResults result={result} term={term}>
              {({articles, pages}) => (
                <div className="sf-search-page__secondary">
                  <SearchResults.Pages pages={pages} term={term} />
                  <SearchResults.Articles articles={articles} term={term} />
                </div>
              )}
            </SearchResults>
          ) : null}
        </div>
      </div>
      <Analytics.SearchView
        data={{searchTerm: term, searchResults: result}}
      />
    </main>
  );
}

async function regularSearch({
  request,
  context,
}: Pick<Route.LoaderArgs, 'request' | 'context'>): Promise<RegularSearchReturn> {
  const {storefront, session, env, customerAccount} = context;
  const url = new URL(request.url);
  const term = String(url.searchParams.get('q') || '');
  const appliedFilters = getAppliedProductFilters(url.searchParams);
  const paginationVariables = getPaginationVariables(request, {pageBy: 24});
  const user = await resolveAuthedUser({session, customerAccount, env});
  const ctx = await getCustomerContext(env, user);
  const seams = getSeams(env);

  const [products, content] = await Promise.all([
    loadSearchProducts(storefront, seams, ctx, {
      term,
      productFilters: appliedFilters as ProductFilter[],
      first: paginationVariables.first,
      last: paginationVariables.last,
      startCursor: paginationVariables.startCursor,
      endCursor: paginationVariables.endCursor,
    }),
    term
      ? storefront.query(SEARCH_CONTENT_QUERY, {
          variables: {term, first: 8},
        })
      : Promise.resolve({articles: {nodes: []}, pages: {nodes: []}}),
  ]);

  const items = {
    products: {
      nodes: products.nodes,
      pageInfo: products.pageInfo,
      filters: products.filters,
      totalCount: products.totalCount,
    },
    articles: content?.articles ?? {nodes: []},
    pages: content?.pages ?? {nodes: []},
  };

  const total =
    products.nodes.length +
    (items.articles.nodes?.length ?? 0) +
    (items.pages.nodes?.length ?? 0);

  return {
    type: 'regular',
    term,
    result: {
      total,
      items,
      hasFilters: appliedFilters.length > 0,
    },
  };
}

const SEARCH_CONTENT_QUERY = `#graphql
  query SearchContent(
    $country: CountryCode
    $language: LanguageCode
    $term: String!
    $first: Int!
  ) @inContext(country: $country, language: $language) {
    articles: search(query: $term, types: [ARTICLE], first: $first) {
      nodes {
        ... on Article {
          __typename
          handle
          id
          title
          trackingParameters
          blog {
            handle
          }
        }
      }
    }
    pages: search(query: $term, types: [PAGE], first: $first) {
      nodes {
        ... on Page {
          __typename
          handle
          id
          title
          trackingParameters
        }
      }
    }
  }
` as const;

const PREDICTIVE_SEARCH_ARTICLE_FRAGMENT = `#graphql
  fragment PredictiveArticle on Article {
    __typename
    id
    title
    handle
    blog {
      handle
    }
    image {
      url
      altText
      width
      height
    }
    trackingParameters
  }
` as const;

const PREDICTIVE_SEARCH_COLLECTION_FRAGMENT = `#graphql
  fragment PredictiveCollection on Collection {
    __typename
    id
    title
    handle
    image {
      url
      altText
      width
      height
    }
    trackingParameters
  }
` as const;

const PREDICTIVE_SEARCH_PAGE_FRAGMENT = `#graphql
  fragment PredictivePage on Page {
    __typename
    id
    title
    handle
    trackingParameters
  }
` as const;

const PREDICTIVE_SEARCH_PRODUCT_FRAGMENT = `#graphql
  fragment PredictiveProduct on Product {
    __typename
    id
    title
    handle
    trackingParameters
    selectedOrFirstAvailableVariant(
      selectedOptions: []
      ignoreUnknownOptions: true
      caseInsensitiveMatch: true
    ) {
      id
      image {
        url
        altText
        width
        height
      }
    }
  }
` as const;

const PREDICTIVE_SEARCH_QUERY_FRAGMENT = `#graphql
  fragment PredictiveQuery on SearchQuerySuggestion {
    __typename
    text
    styledText
    trackingParameters
  }
` as const;

const PREDICTIVE_SEARCH_QUERY = `#graphql
  query PredictiveSearch(
    $country: CountryCode
    $language: LanguageCode
    $limit: Int!
    $limitScope: PredictiveSearchLimitScope!
    $term: String!
    $types: [PredictiveSearchType!]
  ) @inContext(country: $country, language: $language) {
    predictiveSearch(
      limit: $limit,
      limitScope: $limitScope,
      query: $term,
      types: $types,
    ) {
      articles {
        ...PredictiveArticle
      }
      collections {
        ...PredictiveCollection
      }
      pages {
        ...PredictivePage
      }
      products {
        ...PredictiveProduct
      }
      queries {
        ...PredictiveQuery
      }
    }
  }
  ${PREDICTIVE_SEARCH_ARTICLE_FRAGMENT}
  ${PREDICTIVE_SEARCH_COLLECTION_FRAGMENT}
  ${PREDICTIVE_SEARCH_PAGE_FRAGMENT}
  ${PREDICTIVE_SEARCH_PRODUCT_FRAGMENT}
  ${PREDICTIVE_SEARCH_QUERY_FRAGMENT}
` as const;

async function predictiveSearch({
  request,
  context,
}: Pick<
  Route.ActionArgs,
  'request' | 'context'
>): Promise<PredictiveSearchReturn> {
  const {storefront} = context;
  const url = new URL(request.url);
  const term = String(url.searchParams.get('q') || '').trim();
  const limit = Math.min(Number(url.searchParams.get('limit') || 4) || 4, 6);
  const type = 'predictive';

  if (!term) return {type, term, result: getEmptyPredictiveSearchResult()};

  // Skip ARTICLE/PAGE in the header dropdown — fewer Storefront round-trips
  // and less DOM. Full /search still covers pages & articles.
  const {
    predictiveSearch: items,
    errors,
  }: PredictiveSearchQuery & {errors?: Array<{message: string}>} =
    await storefront.query(PREDICTIVE_SEARCH_QUERY, {
      variables: {
        limit,
        limitScope: 'EACH',
        term,
        types: ['PRODUCT', 'COLLECTION', 'QUERY'],
      },
      cache: storefront.CacheShort(),
    });

  if (errors) {
    throw new Error(
      `Shopify API errors: ${errors.map(({message}: {message: string}) => message).join(', ')}`,
    );
  }

  if (!items) {
    throw new Error('No predictive search data returned from Shopify API');
  }

  const total = Object.values(items).reduce(
    (acc: number, item: Array<unknown>) => acc + item.length,
    0,
  );

  return {type, term, result: {items, total}};
}
