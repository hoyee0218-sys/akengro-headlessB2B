import type {ProductCollectionSortKeys} from '@shopify/hydrogen/storefront-api-types';
import {t} from '~/lib/copy';

/** URL search-param helpers for collection PLP facets (S&D → Storefront API). */

export const FILTER_PARAM = 'filter';
export const SORT_PARAM = 'sort';

const PAGINATION_PARAMS = ['cursor', 'direction'] as const;

export type ProductFilterInput = Record<string, unknown>;

export type CollectionSortOption = {
  value: string;
  sortKey: ProductCollectionSortKeys | null;
  reverse: boolean;
};

export const COLLECTION_SORT_OPTIONS: CollectionSortOption[] = [
  {value: 'relevance', sortKey: null, reverse: false},
  {value: 'title-asc', sortKey: 'TITLE', reverse: false},
  {value: 'title-desc', sortKey: 'TITLE', reverse: true},
  {value: 'price-asc', sortKey: 'PRICE', reverse: false},
  {value: 'price-desc', sortKey: 'PRICE', reverse: true},
];

function parseFilterInput(raw: string): ProductFilterInput | null {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as ProductFilterInput;
    }
  } catch {
    // Malformed filter param — ignore.
  }
  return null;
}

/** Parse active `ProductFilter` inputs from the request URL. */
export function getAppliedProductFilters(
  searchParams: URLSearchParams,
): ProductFilterInput[] {
  return searchParams
    .getAll(FILTER_PARAM)
    .map(parseFilterInput)
    .filter((filter): filter is ProductFilterInput => filter !== null);
}

function normalizeFilterInput(input: string | unknown): string {
  return typeof input === 'string' ? input : JSON.stringify(input);
}

export function isFilterActive(
  applied: ProductFilterInput[],
  valueInput: string | unknown,
): boolean {
  const serialized = normalizeFilterInput(valueInput);
  const parsed = parseFilterInput(serialized);
  if (!parsed) {
    return applied.some((filter) => JSON.stringify(filter) === serialized);
  }
  return applied.some(
    (filter) => JSON.stringify(filter) === JSON.stringify(parsed),
  );
}

export function stripPaginationParams(
  params: URLSearchParams,
): URLSearchParams {
  const next = new URLSearchParams(params);
  for (const key of PAGINATION_PARAMS) {
    next.delete(key);
  }
  return next;
}

/** Toggle a facet value on/off and reset pagination cursors. */
export function toggleFilterInParams(
  current: URLSearchParams,
  valueInput: string | unknown,
  activate: boolean,
): URLSearchParams {
  const serialized = normalizeFilterInput(valueInput);
  const next = stripPaginationParams(current);
  const existing = next.getAll(FILTER_PARAM);
  next.delete(FILTER_PARAM);

  const matches = (raw: string) => {
    if (raw === serialized) return true;
    const a = parseFilterInput(raw);
    const b = parseFilterInput(serialized);
    return Boolean(a && b && JSON.stringify(a) === JSON.stringify(b));
  };

  if (activate) {
    const already = existing.some(matches);
    const merged = already ? existing : [...existing, serialized];
    merged.forEach((value) => next.append(FILTER_PARAM, value));
  } else {
    existing
      .filter((value) => !matches(value))
      .forEach((value) => next.append(FILTER_PARAM, value));
  }

  return next;
}

export function clearFiltersInParams(current: URLSearchParams): URLSearchParams {
  const next = stripPaginationParams(current);
  next.delete(FILTER_PARAM);
  return next;
}

export function buildCollectionSearchString(params: URLSearchParams): string {
  const query = params.toString();
  return query ? `?${query}` : '';
}

export function getSortFromSearchParams(searchParams: URLSearchParams): {
  sortKey: ProductCollectionSortKeys | null;
  reverse: boolean;
  value: string;
} {
  const raw = searchParams.get(SORT_PARAM);
  const value = raw && raw.length > 0 ? raw : 'relevance';
  const option =
    COLLECTION_SORT_OPTIONS.find((entry) => entry.value === value) ??
    COLLECTION_SORT_OPTIONS[0];
  return {
    sortKey: option.sortKey,
    reverse: option.reverse,
    value: option.value,
  };
}

export function setSortInParams(
  current: URLSearchParams,
  sortValue: string,
): URLSearchParams {
  const next = stripPaginationParams(current);
  if (sortValue && sortValue !== 'relevance') {
    next.set(SORT_PARAM, sortValue);
  } else {
    next.delete(SORT_PARAM);
  }
  return next;
}

export type CollectionFilterValue = {
  id: string;
  label: string;
  count: number;
  input: string | unknown;
};

export type CollectionFilterType = 'LIST' | 'PRICE_RANGE' | 'BOOLEAN' | string;

export type CollectionFilter = {
  id: string;
  label: string;
  type: CollectionFilterType;
  values: CollectionFilterValue[];
};

export type PriceRangeBounds = {
  min: number | null;
  max: number | null;
};

function isPriceFilter(filter: ProductFilterInput): boolean {
  return (
    Object.prototype.hasOwnProperty.call(filter, 'price') &&
    typeof filter.price === 'object' &&
    filter.price !== null
  );
}

/** Parse a FilterValue.input (or applied filter) into min/max price bounds. */
export function parsePriceRangeInput(
  input: string | unknown,
): PriceRangeBounds | null {
  const parsed =
    typeof input === 'string'
      ? parseFilterInput(input)
      : input && typeof input === 'object' && !Array.isArray(input)
        ? (input as ProductFilterInput)
        : null;

  if (!parsed || !isPriceFilter(parsed)) return null;

  const price = parsed.price as {min?: unknown; max?: unknown};
  const min =
    typeof price.min === 'number' && Number.isFinite(price.min)
      ? price.min
      : price.min != null && price.min !== ''
        ? Number(price.min)
        : null;
  const max =
    typeof price.max === 'number' && Number.isFinite(price.max)
      ? price.max
      : price.max != null && price.max !== ''
        ? Number(price.max)
        : null;

  return {
    min: min != null && Number.isFinite(min) ? min : null,
    max: max != null && Number.isFinite(max) ? max : null,
  };
}

/** Bounds advertised by the S&D PRICE_RANGE filter (collection min/max). */
export function getPriceRangeBounds(
  filter: CollectionFilter,
): PriceRangeBounds {
  for (const value of filter.values) {
    const bounds = parsePriceRangeInput(value.input);
    if (bounds) return bounds;
  }
  return {min: null, max: null};
}

/** Currently applied price filter from URL params (first price filter wins). */
export function getAppliedPriceRange(
  applied: ProductFilterInput[],
): PriceRangeBounds | null {
  for (const filter of applied) {
    const bounds = parsePriceRangeInput(filter);
    if (bounds) return bounds;
  }
  return null;
}

/**
 * Replace any existing price ProductFilter with a new min/max range.
 * Clears the range entirely when both min and max are empty.
 */
export function setPriceRangeInParams(
  current: URLSearchParams,
  min: string | number | null | undefined,
  max: string | number | null | undefined,
): URLSearchParams {
  const next = stripPaginationParams(current);
  const existing = next.getAll(FILTER_PARAM);
  next.delete(FILTER_PARAM);

  existing
    .filter((raw) => {
      const parsed = parseFilterInput(raw);
      return !parsed || !isPriceFilter(parsed);
    })
    .forEach((value) => next.append(FILTER_PARAM, value));

  const minNum =
    min === '' || min == null ? null : Number(min);
  const maxNum =
    max === '' || max == null ? null : Number(max);

  const hasMin = minNum != null && Number.isFinite(minNum);
  const hasMax = maxNum != null && Number.isFinite(maxNum);

  if (hasMin || hasMax) {
    const price: {min?: number; max?: number} = {};
    if (hasMin) price.min = minNum!;
    if (hasMax) price.max = maxNum!;
    next.append(FILTER_PARAM, JSON.stringify({price}));
  }

  return next;
}

export function formatPriceRangeChipLabel(bounds: PriceRangeBounds): string {
  if (bounds.min != null && bounds.max != null) {
    return `${bounds.min}–${bounds.max}`;
  }
  if (bounds.min != null) return t('plp.priceFrom', {value: bounds.min});
  if (bounds.max != null) return t('plp.priceUntil', {value: bounds.max});
  return t('plp.price');
}

/** Facet groups whose value counts partition the result set (safe to sum). */
const COUNT_SOURCE_FILTER_IDS = [
  'filter.v.availability',
  'filter.p.type',
  'filter.p.product_type',
  'filter.p.vendor',
] as const;

/** Facets that can attach multiple values per product — summing over-counts. */
function isUnsafeCountSourceId(filterId: string): boolean {
  const id = filterId.toLowerCase();
  return id.includes('tag') || id.includes('option');
}

function sumFacetValueCounts(values: CollectionFilterValue[]): number {
  const seen = new Set<string>();
  return values.reduce((total, value) => {
    if (seen.has(value.id)) return total;
    seen.add(value.id);
    return total + value.count;
  }, 0);
}

function isSafePartitionFilter(filter: CollectionFilter): boolean {
  if (!filter.values.length) return false;
  if (isUnsafeCountSourceId(filter.id)) return false;
  if (
    (COUNT_SOURCE_FILTER_IDS as readonly string[]).includes(filter.id)
  ) {
    return true;
  }
  // LIST metafields that are single-value-per-product can partition like vendor/type.
  return filter.type === 'LIST';
}

/**
 * Derive total matching products from S&D facet counts.
 * Storefront API has no products.totalCount — sum availability/type/vendor buckets
 * (or another safe partitioning LIST facet when those are missing).
 */
export function getProductCountFromFacetFilters(
  filters: CollectionFilter[],
): number | null {
  for (const filterId of COUNT_SOURCE_FILTER_IDS) {
    const filter = filters.find((entry) => entry.id === filterId);
    if (filter?.values.length) {
      return sumFacetValueCounts(filter.values);
    }
  }

  for (const filter of filters) {
    if (isSafePartitionFilter(filter)) {
      return sumFacetValueCounts(filter.values);
    }
  }

  return null;
}

export type CollectionProductCount = {
  /** Exact total, or a known lower bound when the total cannot be derived. */
  value: number;
  /**
   * True when `value` is only a lower bound (more pages exist and facets
   * did not provide a partition sum). UI should show e.g. "24+".
   */
  isLowerBound: boolean;
};

/**
 * Resolve the PLP product total for display (not current page size alone).
 * Prefers S&D facet sums; otherwise uses pageInfo to avoid claiming a
 * full-page size as the catalog total when more results exist.
 */
export function resolveCollectionProductCount(options: {
  facetFilters: CollectionFilter[];
  pageNodeCount: number;
  hasNextPage?: boolean;
  hasPreviousPage?: boolean;
}): CollectionProductCount {
  const facetTotal = getProductCountFromFacetFilters(options.facetFilters);
  if (facetTotal != null) {
    return {value: facetTotal, isLowerBound: false};
  }

  const pageCount = Math.max(0, options.pageNodeCount);
  const hasNextPage = Boolean(options.hasNextPage);
  const hasPreviousPage = Boolean(options.hasPreviousPage);

  // Single page of results → node count is the true total for this query.
  if (!hasNextPage && !hasPreviousPage) {
    return {value: pageCount, isLowerBound: false};
  }

  // More results exist (or we're mid-pagination) without facet totals —
  // never present page size as an exact catalog count.
  return {value: pageCount, isLowerBound: true};
}

/** Human-readable labels for active filter chips. */
export function getActiveFilterChips(
  filters: CollectionFilter[],
  applied: ProductFilterInput[],
): Array<{id: string; label: string; input: string | unknown}> {
  const chips: Array<{id: string; label: string; input: string | unknown}> =
    [];

  for (const filter of filters) {
    if (filter.type === 'PRICE_RANGE') {
      const appliedPrice = getAppliedPriceRange(applied);
      if (!appliedPrice) continue;
      const price: {min?: number; max?: number} = {};
      if (appliedPrice.min != null) price.min = appliedPrice.min;
      if (appliedPrice.max != null) price.max = appliedPrice.max;
      chips.push({
        id: filter.id,
        label: `${filter.label}: ${formatPriceRangeChipLabel(appliedPrice)}`,
        input: JSON.stringify({price}),
      });
      continue;
    }

    for (const value of filter.values) {
      if (isFilterActive(applied, value.input)) {
        chips.push({
          id: value.id,
          label: value.label,
          input: value.input,
        });
      }
    }
  }

  return chips;
}
