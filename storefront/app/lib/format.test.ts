import {describe, expect, it} from 'vitest';
import {
  currencySymbol,
  currencySymbolPrefixed,
  formatMoney,
  productPath,
  resolveProductBreadcrumbCollection,
} from './format';

describe('formatMoney', () => {
  it('prefixes $, €, £ and suffixes kr (Nordic)', () => {
    expect(formatMoney(4500, {currency: 'USD', locale: 'nb-NO'})).toBe(
      '$4\u00A0500,00',
    );
    expect(formatMoney(4500, {currency: 'EUR', locale: 'nb-NO'})).toBe(
      '€4\u00A0500,00',
    );
    expect(formatMoney(4500, {currency: 'GBP', locale: 'nb-NO'})).toBe(
      '£4\u00A0500,00',
    );
    expect(formatMoney(4500, {currency: 'NOK', locale: 'nb-NO'})).toBe(
      '4\u00A0500,00\u00A0kr',
    );
    expect(formatMoney(4500, {currency: 'SEK', locale: 'nb-NO'})).toBe(
      '4\u00A0500,00\u00A0kr',
    );
  });

  it('does not print ISO codes when a symbol exists', () => {
    expect(formatMoney(10, {currency: 'USD', locale: 'nb-NO'})).not.toContain(
      'USD',
    );
    expect(formatMoney(10, {currency: 'NOK', locale: 'nb-NO'})).not.toContain(
      'NOK',
    );
  });

  it('classifies symbol placement from the store currency code', () => {
    expect(currencySymbolPrefixed('USD')).toBe(true);
    expect(currencySymbolPrefixed('EUR')).toBe(true);
    expect(currencySymbolPrefixed('NOK')).toBe(false);
    expect(currencySymbol('USD')).toBe('$');
    expect(currencySymbol('NOK').toLowerCase()).toContain('kr');
  });
});

describe('productPath', () => {
  it('optionally carries collection context for PDP breadcrumbs', () => {
    expect(productPath('b-44322-57')).toBe('/products/b-44322-57');
    expect(productPath('b-44322-57', {collection: 'inspeksjon'})).toBe(
      '/products/b-44322-57?collection=inspeksjon',
    );
  });
});

describe('resolveProductBreadcrumbCollection', () => {
  const collections = [
    {title: 'All', handle: 'all'},
    {title: 'Inspeksjon', handle: 'inspeksjon'},
    {title: 'Bikes', handle: 'bikes'},
  ];

  it('prefers the PLP collection from the URL when the product belongs to it', () => {
    expect(
      resolveProductBreadcrumbCollection({
        collections,
        preferredHandle: 'inspeksjon',
      }),
    ).toEqual({title: 'Inspeksjon', handle: 'inspeksjon'});
  });

  it('skips the catalog collection and returns the first merchandising collection', () => {
    expect(
      resolveProductBreadcrumbCollection({
        collections,
        preferredHandle: 'all',
      }),
    ).toEqual({title: 'Inspeksjon', handle: 'inspeksjon'});
  });

  it('returns null when the product is only in the catalog collection', () => {
    expect(
      resolveProductBreadcrumbCollection({
        collections: [{title: 'All', handle: 'all'}],
      }),
    ).toBeNull();
  });
});
