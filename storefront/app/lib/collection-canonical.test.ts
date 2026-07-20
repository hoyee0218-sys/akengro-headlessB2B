import {describe, expect, it} from 'vitest';
import {
  buildWhitelistedFilterSearch,
  filterKeySetSignature,
  filterSetSignature,
  isPlpFilterComboWhitelisted,
  resolveCollectionPlpCanonical,
  resolveCollectionPlpCanonicalFromSearch,
  type PlpCanonicalWhitelist,
} from './collection-canonical';

describe('collection-canonical', () => {
  const origin = 'https://shop.example.com';
  const handle = 'inspeksjon';

  it('builds order-independent filter signatures', () => {
    expect(
      filterSetSignature([{productType: 'Bolter'}, {available: true}]),
    ).toBe(
      filterSetSignature([{available: true}, {productType: 'Bolter'}]),
    );
  });

  it('builds key-set signatures from applied filters', () => {
    expect(
      filterKeySetSignature([{productType: 'Bolter'}, {available: true}]),
    ).toBe('available|productType');
  });

  it('matches exact whitelist entries (single or multi)', () => {
    const whitelist: PlpCanonicalWhitelist = {
      exact: [
        {productType: 'Bolter'},
        [{productType: 'Bolter'}, {available: true}],
      ],
    };

    expect(
      isPlpFilterComboWhitelisted([{productType: 'Bolter'}], whitelist),
    ).toBe(true);
    expect(
      isPlpFilterComboWhitelisted(
        [{available: true}, {productType: 'Bolter'}],
        whitelist,
      ),
    ).toBe(true);
    expect(
      isPlpFilterComboWhitelisted([{productType: 'Ventiler'}], whitelist),
    ).toBe(false);
  });

  it('matches keySets for any values', () => {
    const whitelist: PlpCanonicalWhitelist = {
      keySets: [['productType']],
    };

    expect(
      isPlpFilterComboWhitelisted([{productType: 'Anything'}], whitelist),
    ).toBe(true);
    expect(
      isPlpFilterComboWhitelisted(
        [{productType: 'A'}, {available: true}],
        whitelist,
      ),
    ).toBe(false);
  });

  it('canonicalizes unfiltered PLP to itself', () => {
    expect(
      resolveCollectionPlpCanonical({
        origin,
        handle,
        appliedFilters: [],
        whitelist: {exact: [], keySets: []},
      }),
    ).toBe('https://shop.example.com/collections/inspeksjon');
  });

  it('canonicalizes sort-only URLs to the parent (no ?sort= in canonical)', () => {
    const href = resolveCollectionPlpCanonicalFromSearch({
      origin,
      handle,
      searchParams: new URLSearchParams('sort=price-asc'),
      whitelist: {exact: [], keySets: []},
    });

    expect(href).toBe('https://shop.example.com/collections/inspeksjon');
    expect(href).not.toContain('sort=');
  });

  it('canonicalizes pagination-only URLs to the parent', () => {
    expect(
      resolveCollectionPlpCanonicalFromSearch({
        origin,
        handle,
        searchParams: new URLSearchParams('cursor=abc&direction=next'),
        whitelist: {},
      }),
    ).toBe('https://shop.example.com/collections/inspeksjon');
  });

  it('canonicalizes non-whitelisted filters to the parent collection', () => {
    expect(
      resolveCollectionPlpCanonical({
        origin,
        handle,
        appliedFilters: [{productType: 'Bolter'}],
        whitelist: {exact: [], keySets: []},
      }),
    ).toBe('https://shop.example.com/collections/inspeksjon');
  });

  it('self-canonicalizes whitelisted filters and strips sort', () => {
    const href = resolveCollectionPlpCanonicalFromSearch({
      origin,
      handle,
      searchParams: new URLSearchParams([
        ['filter', '{"productType":"Bolter"}'],
        ['sort', 'price-desc'],
        ['cursor', 'xyz'],
      ]),
      whitelist: {keySets: [['productType']]},
    });

    expect(href).toBe(
      `https://shop.example.com/collections/inspeksjon${buildWhitelistedFilterSearch(
        [{productType: 'Bolter'}],
      )}`,
    );
    expect(href).toContain('filter=');
    expect(href).not.toContain('sort=');
    expect(href).not.toContain('cursor=');
  });

  it('self-canonicalizes whitelisted multi-filters (filters only, stable order)', () => {
    const href = resolveCollectionPlpCanonical({
      origin,
      handle,
      appliedFilters: [{available: true}, {productType: 'Bolter'}],
      whitelist: {
        keySets: [['available', 'productType']],
      },
    });

    expect(href).toBe(
      `https://shop.example.com/collections/inspeksjon${buildWhitelistedFilterSearch(
        [{available: true}, {productType: 'Bolter'}],
      )}`,
    );
  });
});
