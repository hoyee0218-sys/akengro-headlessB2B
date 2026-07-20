/* PLP / collection (BUILD.md §4 / ui_kits/storefront PLP).
   Product content from Shopify Storefront API; prices/gating from PricingProvider.
   Facets from Search & Discovery via collection.products.filters; state in URL. */
import {Link, redirect, useLoaderData} from 'react-router';
import type {ProductFilter} from '@shopify/hydrogen/storefront-api-types';
import {getPaginationVariables} from '@shopify/hydrogen';
import type {Route} from './+types/collections.$handle';
import {resolveAuthedUser} from '~/lib/auth';
import {getCustomerContext, getSeams} from '~/lib/seams';
import {
  catalogPath,
  isCatalogAlias,
  productPath,
  resolveCollectionHandle,
} from '~/lib/format';
import {redirectIfHandleIsLocalized} from '~/lib/redirect';
import {
  getAppliedProductFilters,
  getSortFromSearchParams,
  resolveCollectionProductCount,
} from '~/lib/collection-filters';
import {
  COLLECTION_QUERY,
  overlayPricesOnCollectionProducts,
} from '~/lib/collection-page';
import {
  collectionBreadcrumbJsonLd,
  collectionPageJsonLd,
} from '~/lib/seo';
import {resolveCollectionPlpCanonicalFromSearch} from '~/lib/collection-canonical';
import type {StorefrontListProduct} from '~/lib/product-page';
import {Icon} from '~/components/ds/Icon';
import {ProductCard} from '~/components/ds/ProductCard';
import {PaginatedResourceSection} from '~/components/PaginatedResourceSection';
import {CollectionPlpShell} from '~/components/CollectionPlpShell';
import {CollectionEmptyState} from '~/components/CollectionEmptyState';
import {JsonLd} from '~/components/JsonLd';
import {useQuickAdd} from '~/components/QuickAddModal';
import {merchantConfig} from '~/merchant.config';
import {t} from '~/lib/copy';

export const meta: Route.MetaFunction = ({data}) => {
  const title =
    data?.collection?.seo?.title ??
    `${data?.collection?.title ?? t('plp.catalogFallbackTitle')} — ${merchantConfig.merchantName}`;

  const tags: Route.MetaDescriptors = [{title}];

  if (data?.collection?.seo?.description) {
    tags.push({
      name: 'description',
      content: data.collection.seo.description,
    });
  }

  // §3.4: always emit canonical. Sort-only → parent; filters → parent unless whitelisted.
  if (data?.canonicalUrl) {
    tags.push({
      tagName: 'link',
      rel: 'canonical',
      href: data.canonicalUrl,
    });
  }

  return tags;
};

export async function loader({context, params, request}: Route.LoaderArgs) {
  const {env, session, storefront, customerAccount} = context;
  const rawHandle = params.handle;

  if (!rawHandle) {
    throw new Response(t('content.notFound'), {status: 404});
  }

  const handle = resolveCollectionHandle(rawHandle);

  // Normalize /collections/alle → configured catalog handle (default: all)
  if (isCatalogAlias(rawHandle) && handle !== rawHandle) {
    const url = new URL(request.url);
    url.pathname = catalogPath();
    throw redirect(url.toString());
  }

  const url = new URL(request.url);
  const origin = url.origin;
  const filters = getAppliedProductFilters(url.searchParams);
  const {sortKey, reverse} = getSortFromSearchParams(url.searchParams);
  const paginationVariables = getPaginationVariables(request, {pageBy: 24});

  const user = await resolveAuthedUser({session, customerAccount, env});
  const ctx = await getCustomerContext(env, user);
  const seams = getSeams(env);

  const {collection} = await storefront.query(COLLECTION_QUERY, {
    variables: {
      handle,
      filters: filters.length ? (filters as ProductFilter[]) : undefined,
      sortKey: sortKey ?? undefined,
      reverse: sortKey ? reverse : undefined,
      ...paginationVariables,
    },
    cache: storefront.CacheShort(),
  });

  if (!collection) {
    throw new Response(t('content.notFound'), {status: 404});
  }

  if (!collection.products) {
    throw new Response(t('content.notFound'), {status: 404});
  }

  redirectIfHandleIsLocalized(request, {handle, data: collection});

  const pricedNodes = await overlayPricesOnCollectionProducts(
    collection.products.nodes,
    seams,
    ctx,
  );

  const productCount = resolveCollectionProductCount({
    facetFilters: collection.products.filters,
    pageNodeCount: collection.products.nodes.length,
    hasNextPage: collection.products.pageInfo?.hasNextPage,
    hasPreviousPage: collection.products.pageInfo?.hasPreviousPage,
  });

  const canonicalUrl = resolveCollectionPlpCanonicalFromSearch({
    origin,
    handle: collection.handle,
    searchParams: url.searchParams,
  });

  return {
    collection: {
      ...collection,
      products: {
        ...collection.products,
        nodes: pricedNodes,
      },
    },
    productCount:
      pricedNodes.length === 0
        ? {value: 0, isLowerBound: false}
        : productCount,
    hasFilters: filters.length > 0,
    canonicalUrl,
    origin,
    loggedIn: Boolean(ctx),
  };
}

export default function Collection() {
  const {collection, hasFilters, productCount, origin} =
    useLoaderData<typeof loader>();
  const {products} = collection;
  const {openQuickAdd} = useQuickAdd();

  return (
    <main>
      <JsonLd data={collectionBreadcrumbJsonLd(origin, collection)} />
      <JsonLd
        data={collectionPageJsonLd(origin, {
          title: collection.title,
          handle: collection.handle,
          description: collection.description || collection.seo?.description,
        })}
      />
      <div className="sf__wrap">
        <div className="sf-crumb">
          <Link to="/">{t('nav.home')}</Link>{' '}
          <Icon name="chevron-right" size={13} />{' '}
          <span>{collection.title}</span>
        </div>
        <CollectionPlpShell
          title={collection.title}
          productCount={productCount}
          hasFilters={hasFilters}
          filters={products.filters}
        >
          {products.nodes.length === 0 ? (
            <CollectionEmptyState hasFilters={hasFilters} />
          ) : (
            <PaginatedResourceSection<StorefrontListProduct>
              connection={products}
              resourcesClassName="sf-plp__grid"
              ariaLabel={t('plp.productsAria')}
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
                  href={productPath(product.handle, {
                    collection: collection.handle,
                  })}
                  onAddToCart={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (product.price.gated || product.stock === 'out') return;
                    openQuickAdd(product.handle);
                  }}
                />
              )}
            </PaginatedResourceSection>
          )}
        </CollectionPlpShell>
      </div>
    </main>
  );
}
