import {Link, useLocation} from 'react-router';
import {
  buildCollectionSearchString,
  clearFiltersInParams,
} from '~/lib/collection-filters';
import {t} from '~/lib/copy';
import {Button} from '~/components/ds/Button';

/**
 * PLP empty / no-results state when the collection (or active filters) returns no products.
 */
export function CollectionEmptyState({hasFilters}: {hasFilters: boolean}) {
  const location = useLocation();
  const clearTo = `${location.pathname}${buildCollectionSearchString(
    clearFiltersInParams(new URLSearchParams(location.search)),
  )}`;

  return (
    <div className="sf-plp__empty" role="status">
      <h3 className="sf-plp__empty-title">{t('plp.emptyTitle')}</h3>
      <p className="sf-plp__empty-copy">
        {hasFilters ? t('plp.emptyFiltered') : t('plp.emptyCollection')}
      </p>
      {hasFilters ? (
        <Button as={Link} to={clearTo} variant="secondary" size="md">
          {t('plp.clearAllFilters')}
        </Button>
      ) : null}
    </div>
  );
}
