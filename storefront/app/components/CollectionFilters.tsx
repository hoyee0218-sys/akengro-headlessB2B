import {Link, useLocation} from 'react-router';
import {Checkbox} from '~/components/ds/Checkbox';
import {Tag} from '~/components/ds/Tag';
import {PriceRangeFilter} from '~/components/PriceRangeFilter';
import {
  buildCollectionSearchString,
  clearFiltersInParams,
  getActiveFilterChips,
  getAppliedProductFilters,
  isFilterActive,
  toggleFilterInParams,
  type CollectionFilter,
  type CollectionFilterValue,
} from '~/lib/collection-filters';
import {t} from '~/lib/copy';

export function CollectionFilters({filters}: {filters: CollectionFilter[]}) {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const applied = getAppliedProductFilters(searchParams);
  const activeChips = getActiveFilterChips(filters, applied);

  if (!filters.length) {
    return null;
  }

  return (
    <>
      {activeChips.length > 0 && (
        <div className="sf-filters__grp">
          <h4>{t('plp.activeFilters')}</h4>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 6,
              alignItems: 'center',
            }}
          >
            {activeChips.map((chip) => {
              const nextParams = toggleFilterInParams(
                searchParams,
                chip.input,
                false,
              );
              const to = `${location.pathname}${buildCollectionSearchString(nextParams)}`;
              return (
                <Link key={chip.id} to={to} preventScrollReset>
                  <Tag selected>{chip.label} ×</Tag>
                </Link>
              );
            })}
            <Link
              to={`${location.pathname}${buildCollectionSearchString(clearFiltersInParams(searchParams))}`}
              preventScrollReset
              style={{fontSize: 'var(--scale-sm)'}}
            >
              {t('plp.clearAll')}
            </Link>
          </div>
        </div>
      )}

      {filters.map((filter) => (
        <div key={filter.id} className="sf-filters__grp">
          <h4>{filter.label}</h4>
          {filter.type === 'PRICE_RANGE' ? (
            <PriceRangeFilter filter={filter} />
          ) : filter.type === 'BOOLEAN' ? (
            <BooleanFilter filter={filter} />
          ) : (
            <ListFilter filter={filter} />
          )}
        </div>
      ))}
    </>
  );
}

function ListFilter({filter}: {filter: CollectionFilter}) {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const applied = getAppliedProductFilters(searchParams);

  return (
    <div className="sf-filters__list">
      {filter.values.map((value) => (
        <FilterCheckboxLink
          key={value.id}
          value={value}
          isActive={isFilterActive(applied, value.input)}
          label={`${value.label} (${value.count})`}
        />
      ))}
    </div>
  );
}

/**
 * BOOLEAN facets from S&D — typically one checkbox (metafield true/false).
 * Multiple values fall back to the same checkbox list pattern as LIST.
 */
function BooleanFilter({filter}: {filter: CollectionFilter}) {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const applied = getAppliedProductFilters(searchParams);

  if (filter.values.length === 1) {
    const value = filter.values[0];
    return (
      <div className="sf-filters__list">
        <FilterCheckboxLink
          value={value}
          isActive={isFilterActive(applied, value.input)}
          label={value.label || filter.label}
        />
      </div>
    );
  }

  return (
    <div className="sf-filters__list">
      {filter.values.map((value) => (
        <FilterCheckboxLink
          key={value.id}
          value={value}
          isActive={isFilterActive(applied, value.input)}
          label={value.label}
        />
      ))}
    </div>
  );
}

function FilterCheckboxLink({
  value,
  isActive,
  label,
}: {
  value: CollectionFilterValue;
  isActive: boolean;
  label: string;
}) {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const nextParams = toggleFilterInParams(searchParams, value.input, !isActive);
  const to = `${location.pathname}${buildCollectionSearchString(nextParams)}`;

  return (
    <Link
      to={to}
      preventScrollReset
      className="sf-filter-link"
      style={{textDecoration: 'none', color: 'inherit'}}
    >
      <Checkbox label={label} checked={isActive} readOnly tabIndex={-1} />
    </Link>
  );
}
