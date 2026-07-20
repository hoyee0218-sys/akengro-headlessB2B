import {describe, expect, it} from 'vitest';
import {
  FILTER_PARAM,
  clearFiltersInParams,
  formatPriceRangeChipLabel,
  getAppliedPriceRange,
  getAppliedProductFilters,
  getPriceRangeBounds,
  getProductCountFromFacetFilters,
  getSortFromSearchParams,
  isFilterActive,
  parsePriceRangeInput,
  resolveCollectionProductCount,
  setPriceRangeInParams,
  setSortInParams,
  toggleFilterInParams,
} from './collection-filters';

describe('collection-filters', () => {
  it('parses filter JSON from URL params', () => {
    const params = new URLSearchParams();
    params.append(FILTER_PARAM, '{"productType":"Bolter"}');
    params.append(FILTER_PARAM, '{"available":true}');

    expect(getAppliedProductFilters(params)).toEqual([
      {productType: 'Bolter'},
      {available: true},
    ]);
  });

  it('toggles a facet value and strips pagination cursors', () => {
    const params = new URLSearchParams('cursor=abc&direction=next');
    params.append(FILTER_PARAM, '{"productVendor":"Nordvik"}');

    const next = toggleFilterInParams(
      params,
      '{"productType":"Bolter"}',
      true,
    );

    expect(next.get('cursor')).toBeNull();
    expect(next.get('direction')).toBeNull();
    expect(next.getAll(FILTER_PARAM)).toEqual([
      '{"productVendor":"Nordvik"}',
      '{"productType":"Bolter"}',
    ]);
  });

  it('detects active filters by parsed JSON equality', () => {
    const applied = [{productType: 'Bolter'}];
    expect(isFilterActive(applied, '{"productType":"Bolter"}')).toBe(true);
    expect(isFilterActive(applied, '{"productType":"Mutter"}')).toBe(false);
  });

  it('clears all filters', () => {
    const params = new URLSearchParams('cursor=xyz');
    params.append(FILTER_PARAM, '{"available":true}');

    const next = clearFiltersInParams(params);
    expect(next.getAll(FILTER_PARAM)).toEqual([]);
    expect(next.get('cursor')).toBeNull();
  });

  it('sums availability facet counts for collection total', () => {
    const total = getProductCountFromFacetFilters([
      {
        id: 'filter.v.availability',
        label: 'Availability',
        type: 'LIST',
        values: [
          {id: 'a1', label: 'In stock', count: 18, input: '{"available":true}'},
          {id: 'a2', label: 'Out of stock', count: 3, input: '{"available":false}'},
        ],
      },
    ]);
    expect(total).toBe(21);
  });

  it('uses facet total instead of page size', () => {
    expect(
      resolveCollectionProductCount({
        facetFilters: [
          {
            id: 'filter.v.availability',
            label: 'Availability',
            type: 'LIST',
            values: [
              {id: 'a1', label: 'In stock', count: 18, input: '{"available":true}'},
              {id: 'a2', label: 'Out of stock', count: 30, input: '{"available":false}'},
            ],
          },
        ],
        pageNodeCount: 24,
      }),
    ).toEqual({value: 48, isLowerBound: false});
  });

  it('uses a safe LIST facet when known partition ids are missing', () => {
    expect(
      getProductCountFromFacetFilters([
        {
          id: 'filter.p.m.custom.category',
          label: 'Category',
          type: 'LIST',
          values: [
            {id: 'c1', label: 'A', count: 10, input: '{}'},
            {id: 'c2', label: 'B', count: 5, input: '{}'},
          ],
        },
      ]),
    ).toBe(15);
  });

  it('does not sum tag facets (multi-value per product)', () => {
    expect(
      getProductCountFromFacetFilters([
        {
          id: 'filter.p.tag',
          label: 'Tag',
          type: 'LIST',
          values: [
            {id: 't1', label: 'Sale', count: 10, input: '{}'},
            {id: 't2', label: 'New', count: 8, input: '{}'},
          ],
        },
      ]),
    ).toBeNull();
  });

  it('treats a single page without facets as an exact total', () => {
    expect(
      resolveCollectionProductCount({
        facetFilters: [],
        pageNodeCount: 12,
        hasNextPage: false,
        hasPreviousPage: false,
      }),
    ).toEqual({value: 12, isLowerBound: false});
  });

  it('marks page size as a lower bound when more pages exist without facets', () => {
    expect(
      resolveCollectionProductCount({
        facetFilters: [],
        pageNodeCount: 24,
        hasNextPage: true,
        hasPreviousPage: false,
      }),
    ).toEqual({value: 24, isLowerBound: true});
  });

  it('maps missing sort param to relevance', () => {
    const params = new URLSearchParams();
    expect(getSortFromSearchParams(params)).toMatchObject({
      value: 'relevance',
      sortKey: null,
    });
  });

  it('clears sort param when relevance is selected', () => {
    const params = new URLSearchParams('sort=price-asc&cursor=abc');
    const next = setSortInParams(params, 'relevance');
    expect(next.get('sort')).toBeNull();
    expect(next.get('cursor')).toBeNull();
  });

  it('parses price range filter input', () => {
    expect(parsePriceRangeInput('{"price":{"min":10,"max":99.5}}')).toEqual({
      min: 10,
      max: 99.5,
    });
    expect(parsePriceRangeInput('{"productType":"Bolter"}')).toBeNull();
  });

  it('reads applied price range and replaces existing price filters', () => {
    const params = new URLSearchParams();
    params.append(FILTER_PARAM, '{"productVendor":"Nordvik"}');
    params.append(FILTER_PARAM, '{"price":{"min":5,"max":20}}');

    const applied = getAppliedProductFilters(params);
    expect(getAppliedPriceRange(applied)).toEqual({min: 5, max: 20});

    const next = setPriceRangeInParams(params, 10, 50);
    expect(next.getAll(FILTER_PARAM)).toEqual([
      '{"productVendor":"Nordvik"}',
      '{"price":{"min":10,"max":50}}',
    ]);
  });

  it('clears price range when min and max are empty', () => {
    const params = new URLSearchParams();
    params.append(FILTER_PARAM, '{"price":{"min":1,"max":2}}');
    const next = setPriceRangeInParams(params, '', '');
    expect(next.getAll(FILTER_PARAM)).toEqual([]);
  });

  it('reads PRICE_RANGE bounds from facet values', () => {
    expect(
      getPriceRangeBounds({
        id: 'filter.v.price',
        label: 'Pris',
        type: 'PRICE_RANGE',
        values: [
          {
            id: 'p1',
            label: 'Price',
            count: 0,
            input: '{"price":{"min":0,"max":199}}',
          },
        ],
      }),
    ).toEqual({min: 0, max: 199});
  });

  it('formats price chip labels', () => {
    expect(formatPriceRangeChipLabel({min: 10, max: 50})).toBe('10–50');
    expect(formatPriceRangeChipLabel({min: 10, max: null})).toBe('Fra 10');
    expect(formatPriceRangeChipLabel({min: null, max: 50})).toBe('Til 50');
  });
});
