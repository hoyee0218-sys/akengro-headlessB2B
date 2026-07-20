/* Collections index — Nordvik catalog chrome (not Hydrogen scaffold).
   Lists Shopify collections; each tile links to /collections/{handle}. */
import {Link, useLoaderData} from 'react-router';
import {getPaginationVariables, Image} from '@shopify/hydrogen';
import type {CollectionFragment} from 'storefrontapi.generated';
import type {Route} from './+types/collections._index';
import {merchantConfig} from '~/merchant.config';
import {breadcrumbListJsonLd} from '~/lib/seo';
import {t} from '~/lib/copy';
import {Icon} from '~/components/ds/Icon';
import {JsonLd} from '~/components/JsonLd';
import {PaginatedResourceSection} from '~/components/PaginatedResourceSection';

export const meta: Route.MetaFunction = () => [
  {title: `${t('collections.title')} — ${merchantConfig.merchantName}`},
  {
    name: 'description',
    content: t('collections.metaDescription'),
  },
];

export async function loader({context, request}: Route.LoaderArgs) {
  const paginationVariables = getPaginationVariables(request, {pageBy: 24});
  const origin = new URL(request.url).origin;

  const {collections} = await context.storefront.query(COLLECTIONS_QUERY, {
    variables: paginationVariables,
  });

  return {collections, origin};
}

export default function CollectionsIndex() {
  const {collections, origin} = useLoaderData<typeof loader>();
  const nodes = collections.nodes ?? [];

  return (
    <main>
      <JsonLd
        data={breadcrumbListJsonLd(origin, [
          {name: t('nav.home'), path: '/'},
          {name: t('collections.title'), path: '/collections'},
        ])}
      />
      <div className="sf__wrap">
        <div className="sf-crumb">
          <Link to="/">{t('nav.home')}</Link>{' '}
          <Icon name="chevron-right" size={13} />{' '}
          <span>{t('collections.title')}</span>
        </div>

        <div className="sf-collections">
          <div className="sf-plp__bar">
            <div className="sf-plp__heading">
              <h2>{t('collections.title')}</h2>
              <div className="sf-plp__count">
                {t('collections.subtitle')}
              </div>
            </div>
          </div>

          {nodes.length === 0 ? (
            <div className="sf-plp__empty" role="status">
              <h3 className="sf-plp__empty-title">{t('collections.emptyTitle')}</h3>
              <p className="sf-plp__empty-copy">
                {t('collections.emptyBody')}
              </p>
            </div>
          ) : (
            <PaginatedResourceSection<CollectionFragment>
              connection={collections}
              resourcesClassName="sf-collections__grid"
              ariaLabel={t('collections.aria')}
            >
              {({node: collection, index}) => (
                <CollectionCard
                  key={collection.id}
                  collection={collection}
                  index={index}
                />
              )}
            </PaginatedResourceSection>
          )}
        </div>
      </div>
    </main>
  );
}

function CollectionCard({
  collection,
  index,
}: {
  collection: CollectionFragment;
  index: number;
}) {
  const description = collection.description?.trim();

  return (
    <Link
      className="sf-collection-card"
      to={`/collections/${collection.handle}`}
      prefetch="intent"
    >
      <div
        className="sf-collection-card__media"
        data-has-image={Boolean(collection.image) || undefined}
      >
        {collection.image ? (
          <Image
            alt={collection.image.altText || collection.title}
            data={collection.image}
            loading={index < 6 ? 'eager' : 'lazy'}
            sizes="(min-width: 62em) 25vw, (min-width: 40em) 33vw, 50vw"
            className="sf-collection-card__img"
          />
        ) : (
          <Icon name="package" size={36} />
        )}
      </div>
      <div className="sf-collection-card__body">
        <h3 className="sf-collection-card__title">{collection.title}</h3>
        {description ? (
          <p className="sf-collection-card__desc">{description}</p>
        ) : null}
      </div>
    </Link>
  );
}

const COLLECTIONS_QUERY = `#graphql
  fragment Collection on Collection {
    id
    title
    handle
    description
    image {
      id
      url
      altText
      width
      height
    }
  }
  query StoreCollections(
    $country: CountryCode
    $endCursor: String
    $first: Int
    $language: LanguageCode
    $last: Int
    $startCursor: String
  ) @inContext(country: $country, language: $language) {
    collections(
      first: $first,
      last: $last,
      before: $startCursor,
      after: $endCursor
    ) {
      nodes {
        ...Collection
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
