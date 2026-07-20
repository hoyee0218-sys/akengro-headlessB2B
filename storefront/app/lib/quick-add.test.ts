import {describe, expect, it} from 'vitest';
import {
  findQuickAddVariant,
  isQuickAddOptionAvailable,
  quickAddCartId,
  type QuickAddVariant,
} from './quick-add';

const variants: QuickAddVariant[] = [
  {
    id: '1',
    sku: 'SHIRT-S',
    title: 'Small',
    availableForSale: true,
    selectedOptions: [
      {name: 'Size', value: 'S'},
      {name: 'Color', value: 'Blue'},
    ],
    imageUrl: null,
    price: {
      amount: 100,
      listAmount: null,
      currency: 'NOK',
      gated: false,
      demo: true,
    },
    stock: 'in',
  },
  {
    id: '2',
    sku: 'SHIRT-M',
    title: 'Medium',
    availableForSale: false,
    selectedOptions: [
      {name: 'Size', value: 'M'},
      {name: 'Color', value: 'Blue'},
    ],
    imageUrl: null,
    price: {
      amount: 100,
      listAmount: null,
      currency: 'NOK',
      gated: false,
      demo: true,
    },
    stock: 'out',
  },
  {
    id: '3',
    sku: 'SHIRT-S-RED',
    title: 'Small Red',
    availableForSale: true,
    selectedOptions: [
      {name: 'Size', value: 'S'},
      {name: 'Color', value: 'Red'},
    ],
    imageUrl: null,
    price: {
      amount: 110,
      listAmount: null,
      currency: 'NOK',
      gated: false,
      demo: true,
    },
    stock: 'in',
  },
];

describe('quick-add helpers', () => {
  it('finds the variant for the selected options', () => {
    expect(
      findQuickAddVariant(variants, {Size: 'S', Color: 'Red'})?.sku,
    ).toBe('SHIRT-S-RED');
    expect(findQuickAddVariant(variants, {Size: 'L', Color: 'Blue'})).toBeNull();
  });

  it('checks whether an option value exists for other selections', () => {
    expect(
      isQuickAddOptionAvailable(variants, 'Size', 'M', {Color: 'Blue'}),
    ).toBe(true);
    expect(
      isQuickAddOptionAvailable(variants, 'Size', 'M', {Color: 'Red'}),
    ).toBe(false);
  });

  it('prefers SKU for the cart line id', () => {
    expect(quickAddCartId({handle: 'shirt'}, variants[0])).toBe('SHIRT-S');
    expect(quickAddCartId({handle: 'shirt'}, {sku: ''})).toBe('shirt');
  });
});
