import {useEffect, useId, useState, type ReactNode} from 'react';
import {useLocation} from 'react-router';
import {Button} from '~/components/ds/Button';
import {Icon} from '~/components/ds/Icon';
import {CollectionFilters} from '~/components/CollectionFilters';
import {CollectionSort} from '~/components/CollectionSort';
import type {
  CollectionFilter,
  CollectionProductCount,
} from '~/lib/collection-filters';
import {getAppliedProductFilters} from '~/lib/collection-filters';
import {t} from '~/lib/copy';

/**
 * PLP chrome: desktop sticky filter sidebar + Dawn-style mobile filter drawer.
 * Layout tokens/CSS live in storefront.css — merchants re-theme via tokens only.
 */
export function CollectionPlpShell({
  title,
  productCount,
  hasFilters,
  filters,
  showSort = true,
  children,
}: {
  title: string;
  productCount: CollectionProductCount;
  hasFilters: boolean;
  filters: CollectionFilter[];
  /** Hide collection sort controls (e.g. search uses relevance). */
  showSort?: boolean;
  children: ReactNode;
}) {
  const location = useLocation();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const titleId = useId();
  const panelId = useId();
  const appliedCount = getAppliedProductFilters(
    new URLSearchParams(location.search),
  ).length;
  const showFilters = filters.length > 0;
  const countLabel = productCount.isLowerBound
    ? t('plp.productCountLowerBound', {count: productCount.value})
    : t('plp.productCount', {count: productCount.value});

  // Close the drawer after a facet navigation (URL change), like Online Store.
  useEffect(() => {
    setFiltersOpen(false);
  }, [location.search, location.pathname]);

  useEffect(() => {
    if (!filtersOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setFiltersOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', onKey);
    };
  }, [filtersOpen]);

  return (
    <div className="sf-plp" data-filters-open={filtersOpen || undefined}>
      {showFilters && (
        <aside
          className="sf-filters sf-filters--desktop"
          aria-label={t('plp.filters')}
        >
          <CollectionFilters filters={filters} />
        </aside>
      )}

      <div className="sf-plp__main">
        <div className="sf-plp__bar">
          <div className="sf-plp__heading">
            <h2>{title}</h2>
            <div className="sf-plp__count">
              {countLabel}
              {hasFilters ? t('plp.filtered') : ''}
            </div>
          </div>
          <div className="sf-plp__sort sf-plp__sort--desktop">
            {showSort ? <CollectionSort /> : null}
          </div>
        </div>

        <div className="sf-plp__toolbar">
          {showFilters && (
            <Button
              type="button"
              variant="secondary"
              size="md"
              className="sf-plp__filter-btn"
              iconStart={<Icon name="sliders-horizontal" size={16} />}
              onClick={() => setFiltersOpen(true)}
              aria-expanded={filtersOpen}
              aria-controls={panelId}
            >
              {t('plp.filter')}
              {appliedCount > 0 ? ` (${appliedCount})` : ''}
            </Button>
          )}
          <div className="sf-plp__sort sf-plp__sort--mobile">
            {showSort ? <CollectionSort /> : null}
          </div>
        </div>

        {children}
      </div>

      {showFilters && (
        <div
          className="sf-filters-drawer"
          data-open={filtersOpen || undefined}
          aria-hidden={!filtersOpen}
        >
          <button
            type="button"
            className="sf-filters-drawer__backdrop"
            aria-label={t('plp.closeFilters')}
            onClick={() => setFiltersOpen(false)}
          />
          <div
            id={panelId}
            className="sf-filters-drawer__panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
          >
            <header className="sf-filters-drawer__head">
              <h3 id={titleId}>{t('plp.filter')}</h3>
              <button
                type="button"
                className="sf-filters-drawer__close"
                aria-label={t('plp.close')}
                onClick={() => setFiltersOpen(false)}
              >
                <Icon name="x" size={20} />
              </button>
            </header>
            <div className="sf-filters-drawer__body">
              <CollectionFilters filters={filters} />
            </div>
            <footer className="sf-filters-drawer__foot">
              <Button
                type="button"
                variant="primary"
                block
                onClick={() => setFiltersOpen(false)}
              >
                {t('plp.showResults')}
              </Button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}
