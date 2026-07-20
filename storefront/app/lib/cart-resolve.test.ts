import {describe, expect, it} from 'vitest';
import {resolveCartLines} from './cart-resolve';
import type {B2BCartLine} from './cart';
import type {CatalogProduct} from './seams/types';

const catalog: CatalogProduct[] = [
  {
    id: 'vlv-8830',
    sku: 'VLV-8830-SS',
    title: 'Kuleventil DN25 rustfritt stål',
    cat: 'Ventiler',
    amount: 1248,
    listAmount: 1390,
    stock: 'in',
    lead: 'sendes i dag',
    material: 'Rustfritt stål 316',
    breaks: [],
  },
];

describe('resolveCartLines', () => {
  it('uses the add-time snapshot when present', async () => {
    const cart: B2BCartLine[] = [
      {
        productId: 'CannondaleSystemSixHiMod-60',
        qty: 5,
        title: 'Cannondale SYSTEMSIX HiMOD',
        sku: 'CannondaleSystemSixHiMod-60',
        amount: 89900,
        handle: 'cannondale-systemsix-himod',
      },
    ];
    const lines = await resolveCartLines(cart, catalog);
    expect(lines).toEqual([
      {
        id: 'CannondaleSystemSixHiMod-60',
        title: 'Cannondale SYSTEMSIX HiMOD',
        sku: 'CannondaleSystemSixHiMod-60',
        amount: 89900,
        qty: 5,
        currency: undefined,
        handle: 'cannondale-systemsix-himod',
        imageUrl: undefined,
        variantTitle: undefined,
      },
    ]);
  });

  it('matches catalog products by id or sku', async () => {
    const byId = await resolveCartLines(
      [{productId: 'vlv-8830', qty: 12}],
      catalog,
    );
    expect(byId[0]).toMatchObject({
      title: 'Kuleventil DN25 rustfritt stål',
      sku: 'VLV-8830-SS',
      amount: 1248,
      qty: 12,
    });

    const bySku = await resolveCartLines(
      [{productId: 'VLV-8830-SS', qty: 2}],
      catalog,
    );
    expect(bySku[0].title).toBe('Kuleventil DN25 rustfritt stål');
  });

  it('never drops unresolved lines', async () => {
    const lines = await resolveCartLines(
      [{productId: 'unknown-sku', qty: 3}],
      catalog,
    );
    expect(lines).toEqual([
      {
        id: 'unknown-sku',
        title: 'unknown-sku',
        sku: 'unknown-sku',
        amount: 0,
        qty: 3,
        currency: undefined,
        handle: undefined,
        imageUrl: undefined,
        variantTitle: undefined,
      },
    ]);
  });
});
