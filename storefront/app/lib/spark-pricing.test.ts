import {describe, expect, it} from 'vitest';
import {
  parseSparkPriceListIds,
  selectEntitledPricing,
  tiersToPriceBreaks,
  unitPriceFromTiers,
  applyStorefrontMultiplier,
} from './spark-pricing';
import {multiplierFromRules} from './spark-api';

describe('parseSparkPriceListIds', () => {
  it('parses a JSON string array', () => {
    expect(parseSparkPriceListIds('["engros-a","base"]')).toEqual([
      'engros-a',
      'base',
    ]);
  });

  it('parses nested price_lists object', () => {
    expect(
      parseSparkPriceListIds('{"price_lists":[{"slug":"vip"},"base"]}'),
    ).toEqual(['vip', 'base']);
  });

  it('treats plain text as a single slug', () => {
    expect(parseSparkPriceListIds('wholesale')).toEqual(['wholesale']);
  });

  it('returns empty for blank', () => {
    expect(parseSparkPriceListIds(null)).toEqual([]);
    expect(parseSparkPriceListIds('  ')).toEqual([]);
  });
});

describe('selectEntitledPricing', () => {
  const rows = [
    {
      price_list_slug: 'other-co',
      pricing: [{quantity: 1, price: 9}],
    },
    {
      price_list_slug: 'engros-a',
      pricing: [
        {quantity: 1, price: 100},
        {quantity: 10, price: 90},
      ],
    },
    {
      price_list_slug: 'base',
      pricing: [{quantity: 1, price: 120}],
    },
  ];

  it('picks the first entitled list in cascade order', () => {
    const hit = selectEntitledPricing(rows, ['engros-a', 'base']);
    expect(hit?.price_list_slug).toBe('engros-a');
    expect(unitPriceFromTiers(hit!.pricing)).toBe(100);
  });

  it('ISOLATION: never returns another company list', () => {
    const hit = selectEntitledPricing(rows, ['engros-a']);
    expect(hit?.price_list_slug).toBe('engros-a');
    expect(hit?.pricing[0]?.price).not.toBe(9);
  });

  it('returns null when none of the entitled lists have the SKU', () => {
    expect(selectEntitledPricing(rows, ['missing-list'])).toBeNull();
  });

  it('returns null when priceListIds is empty (fail closed)', () => {
    expect(selectEntitledPricing(rows, [])).toBeNull();
  });
});

describe('tiersToPriceBreaks', () => {
  it('maps and sorts by minQty', () => {
    expect(
      tiersToPriceBreaks([
        {quantity: 10, price: 90},
        {quantity: 1, price: 100},
      ]),
    ).toEqual([
      {minQty: 1, price: 100},
      {minQty: 10, price: 90},
    ]);
  });
});

describe('multiplierFromRules / applyStorefrontMultiplier', () => {
  it('maps decrease 15% to 0.85', () => {
    expect(
      multiplierFromRules([
        {adjustment_percentage: 0.15, adjustment_direction: 'minus'},
      ]),
    ).toBe(0.85);
  });

  it('applies multiplier to Shopify amount', () => {
    expect(applyStorefrontMultiplier(78900, 0.85)).toEqual({
      amount: 67065,
      listAmount: 78900,
    });
  });
});
