import {Link} from 'react-router';
import {urlWithTrackingParams, type RegularSearchReturn} from '~/lib/search';
import {t} from '~/lib/copy';

type SearchItems = NonNullable<RegularSearchReturn['result']>['items'];
type PartialSearchResult<ItemType extends keyof SearchItems> = Pick<
  SearchItems,
  ItemType
> &
  Pick<RegularSearchReturn, 'term'>;

type SearchResultsProps = {
  term: string;
  result: NonNullable<RegularSearchReturn['result']>;
  children: (args: SearchItems & {term: string}) => React.ReactNode;
};

export function SearchResults({term, result, children}: SearchResultsProps) {
  if (!result?.total) {
    return null;
  }

  return children({...result.items, term});
}

SearchResults.Articles = SearchResultsArticles;
SearchResults.Pages = SearchResultsPages;
SearchResults.Empty = SearchResultsEmpty;

function SearchResultsArticles({
  term,
  articles,
}: PartialSearchResult<'articles'>) {
  if (!articles?.nodes.length) {
    return null;
  }

  return (
    <div className="sf-search-secondary">
      <h2>{t('search.articles')}</h2>
      <ul>
        {articles.nodes.map((article) => {
          const blogHandle =
            'blog' in article &&
            article.blog &&
            typeof article.blog === 'object' &&
            'handle' in article.blog
              ? String(article.blog.handle)
              : null;
          if (!blogHandle) return null;

          const articleUrl = urlWithTrackingParams({
            baseUrl: `/blogs/${blogHandle}/${article.handle}`,
            trackingParams: article.trackingParameters,
            term,
          });

          return (
            <li key={article.id}>
              <Link prefetch="intent" to={articleUrl}>
                {article.title}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function SearchResultsPages({term, pages}: PartialSearchResult<'pages'>) {
  if (!pages?.nodes.length) {
    return null;
  }

  return (
    <div className="sf-search-secondary">
      <h2>{t('search.pages')}</h2>
      <ul>
        {pages.nodes.map((page) => {
          const pageUrl = urlWithTrackingParams({
            baseUrl: `/pages/${page.handle}`,
            trackingParams: page.trackingParameters,
            term,
          });

          return (
            <li key={page.id}>
              <Link prefetch="intent" to={pageUrl}>
                {page.title}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function SearchResultsEmpty() {
  return <p>{t('search.noResults')}</p>;
}
