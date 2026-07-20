import {describe, expect, it} from 'vitest';
import {mapSearchProductFilters} from './search-page';

describe('mapSearchProductFilters', () => {
  it('maps LIST, PRICE_RANGE, and BOOLEAN facets from Search & Discovery', () => {
    const filters = mapSearchProductFilters([
      {
        id: 'filter.p.product_type',
        label: 'Product type',
        type: 'LIST',
        values: [
          {
            id: 'pt1',
            label: 'Sandblasing',
            count: 4,
            input: {productType: 'Sandblasing'},
          },
        ],
      },
      {
        id: 'filter.v.price',
        label: 'Price',
        type: 'PRICE_RANGE',
        values: [
          {
            id: 'price',
            label: 'Price',
            count: 0,
            input: {price: {min: 0, max: 999}},
          },
        ],
      },
      {
        id: 'filter.p.m.custom.featured',
        label: 'Featured',
        type: 'BOOLEAN',
        values: [
          {
            id: 'feat',
            label: 'Featured',
            count: 2,
            input: {productMetafield: {namespace: 'custom', key: 'featured', value: 'true'}},
          },
        ],
      },
    ]);

    expect(filters).toEqual([
      {
        id: 'filter.p.product_type',
        label: 'Product type',
        type: 'LIST',
        values: [
          {
            id: 'pt1',
            label: 'Sandblasing',
            count: 4,
            input: {productType: 'Sandblasing'},
          },
        ],
      },
      {
        id: 'filter.v.price',
        label: 'Price',
        type: 'PRICE_RANGE',
        values: [
          {
            id: 'price',
            label: 'Price',
            count: 0,
            input: {price: {min: 0, max: 999}},
          },
        ],
      },
      {
        id: 'filter.p.m.custom.featured',
        label: 'Featured',
        type: 'BOOLEAN',
        values: [
          {
            id: 'feat',
            label: 'Featured',
            count: 2,
            input: {
              productMetafield: {
                namespace: 'custom',
                key: 'featured',
                value: 'true',
              },
            },
          },
        ],
      },
    ]);
  });

  it('skips filters without id/label and values without id', () => {
    expect(
      mapSearchProductFilters([
        {id: null, label: 'Broken', type: 'LIST', values: []},
        {
          id: 'ok',
          label: 'Ok',
          type: 'LIST',
          values: [
            {id: null, label: 'skip', count: 1},
            {id: 'keep', label: 'Keep', count: 3},
          ],
        },
      ]),
    ).toEqual([
      {
        id: 'ok',
        label: 'Ok',
        type: 'LIST',
        values: [{id: 'keep', label: 'Keep', count: 3, input: undefined}],
      },
    ]);
  });

  it('returns an empty list for missing filters', () => {
    expect(mapSearchProductFilters(null)).toEqual([]);
    expect(mapSearchProductFilters(undefined)).toEqual([]);
  });
});
