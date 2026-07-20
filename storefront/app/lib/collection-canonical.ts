/**
 * Filtered PLP canonical resolution (BASELINE-BUILD §3.4).
 * Default: filtered URLs canonicalize to the parent collection.
 * Merchants opt specific combos back in via merchantConfig.seo.plpCanonicalWhitelist.
 *
 * Sort (`?sort=`) and pagination (`?cursor=` / `?direction=`) never appear in
 * the canonical — including sort-only URLs, which canonicalize to the parent.
 */
import {merchantConfig} from '~/merchant.config';
import {
  FILTER_PARAM,
  getAppliedProductFilters,
  type ProductFilterInput,
} from '~/lib/collection-filters';
import {absoluteUrl} from '~/lib/seo';

/** One ProductFilter object, or a full applied set for multi-facet landings. */
export type PlpCanonicalExactEntry =
  | ProductFilterInput
  | ProductFilterInput[];

export type PlpCanonicalWhitelist = {
  /**
   * Exact filter sets that may keep a self-referencing canonical.
   * A single object means “exactly this one `?filter=` value”.
   * An array means “exactly these filters (order-independent)”.
   *
   * @example
   * exact: [{ productType: 'Bolter' }]
   * exact: [[{ productType: 'Bolter' }, { available: true }]]
   */
  exact?: PlpCanonicalExactEntry[];
  /**
   * Allow any values when the set of top-level ProductFilter keys matches.
   * @example keySets: [['productType']] — all single product-type landings
   */
  keySets?: string[][];
};

function stableSerialize(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map(stableSerialize).join(',')}]`;
  }
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  return `{${keys
    .map((key) => `${JSON.stringify(key)}:${stableSerialize(obj[key])}`)
    .join(',')}}`;
}

/** Order-independent signature for an applied filter set. */
export function filterSetSignature(filters: ProductFilterInput[]): string {
  return filters
    .map((filter) => stableSerialize(filter))
    .sort()
    .join('|');
}

function normalizeExactEntry(entry: PlpCanonicalExactEntry): ProductFilterInput[] {
  return Array.isArray(entry) ? entry : [entry];
}

/** Sorted unique top-level keys across all applied filters. */
export function filterKeySetSignature(filters: ProductFilterInput[]): string {
  const keys = new Set<string>();
  for (const filter of filters) {
    for (const key of Object.keys(filter)) {
      keys.add(key);
    }
  }
  return [...keys].sort().join('|');
}

function keySetSignatureFromList(keys: string[]): string {
  return [...new Set(keys)].sort().join('|');
}

/**
 * Whether this applied filter combo is merchant-whitelisted for indexing.
 * Empty whitelist → never (safe SEO default).
 */
export function isPlpFilterComboWhitelisted(
  applied: ProductFilterInput[],
  whitelist: PlpCanonicalWhitelist = merchantConfig.seo?.plpCanonicalWhitelist ??
    {},
): boolean {
  if (!applied.length) return false;

  const appliedSig = filterSetSignature(applied);
  for (const entry of whitelist.exact ?? []) {
    if (filterSetSignature(normalizeExactEntry(entry)) === appliedSig) {
      return true;
    }
  }

  const appliedKeys = filterKeySetSignature(applied);
  for (const keys of whitelist.keySets ?? []) {
    if (keySetSignatureFromList(keys) === appliedKeys) {
      return true;
    }
  }

  return false;
}

/** Canonical query for a whitelisted filtered PLP: filters only (no sort/pagination). */
export function buildWhitelistedFilterSearch(
  filters: ProductFilterInput[],
): string {
  const params = new URLSearchParams();
  const sorted = [...filters].sort(
    (a, b) => stableSerialize(a).localeCompare(stableSerialize(b)),
  );
  for (const filter of sorted) {
    params.append(FILTER_PARAM, stableSerialize(filter));
  }
  const query = params.toString();
  return query ? `?${query}` : '';
}

/**
 * Resolve the absolute canonical URL for a collection PLP.
 * - No filters (including sort-only / pagination-only) → parent `/collections/{handle}`
 * - Filters + whitelist match → self with normalized `?filter=` only (sort stripped)
 * - Filters + no match → parent collection (no query)
 */
export function resolveCollectionPlpCanonical(options: {
  origin: string;
  handle: string;
  appliedFilters: ProductFilterInput[];
  whitelist?: PlpCanonicalWhitelist;
}): string {
  const path = `/collections/${options.handle}`;
  const parent = absoluteUrl(options.origin, path);

  if (!options.appliedFilters.length) {
    return parent;
  }

  if (
    !isPlpFilterComboWhitelisted(
      options.appliedFilters,
      options.whitelist ?? merchantConfig.seo?.plpCanonicalWhitelist,
    )
  ) {
    return parent;
  }

  return absoluteUrl(
    options.origin,
    `${path}${buildWhitelistedFilterSearch(options.appliedFilters)}`,
  );
}

/**
 * Resolve canonical from the request search string.
 * Only `?filter=` affects the result — `sort`, `cursor`, and `direction` are ignored.
 */
export function resolveCollectionPlpCanonicalFromSearch(options: {
  origin: string;
  handle: string;
  searchParams: URLSearchParams;
  whitelist?: PlpCanonicalWhitelist;
}): string {
  return resolveCollectionPlpCanonical({
    origin: options.origin,
    handle: options.handle,
    appliedFilters: getAppliedProductFilters(options.searchParams),
    whitelist: options.whitelist,
  });
}
