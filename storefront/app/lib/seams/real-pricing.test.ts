import {afterEach, describe, expect, it, vi} from 'vitest';
import {clearSparkTokenCache} from '../spark-api';
import {createRealPricingProvider} from './real';

const b2bCtx = {
  customerId: 'cust-a',
  companyId: 'co-a',
  companyName: 'A AS',
  orgnr: '—',
  priceListIds: ['engros-a'],
  priceListLabel: 'engros-a',
  terms: '—',
  permissions: ['order:create' as const],
  credit: {limit: 0, used: 0},
  demo: false,
};
afterEach(() => {
  clearSparkTokenCache();
  vi.restoreAllMocks();
});
describe('createRealPricingProvider', () => {
  it('gates when logged out', async () => {
    const pricing = createRealPricingProvider(
      {
        PUBLIC_SPARKLAYER_SITE_ID: 'site',
        SPARKLAYER_CLIENT_ID: 'id',
        SPARKLAYER_CLIENT_SECRET: 'secret',
      },
      {currency: 'NOK'},
    );
    await expect(pricing.getPriceForCustomer('SKU-1', null)).resolves.toEqual({
      amount: null,
      listAmount: null,
      currency: 'NOK',
      gated: true,
      demo: false,
    });
  });

  it('gates when API credentials are missing', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const pricing = createRealPricingProvider({}, {currency: 'NOK'});
    const price = await pricing.getPriceForCustomer('SKU-1', b2bCtx);
    expect(price.gated).toBe(true);
    expect(warn).toHaveBeenCalled();
  });

  it('gates when customer has no price lists (authz fail-closed)', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const pricing = createRealPricingProvider(
      {
        PUBLIC_SPARKLAYER_SITE_ID: 'site',
        SPARKLAYER_CLIENT_ID: 'id',
        SPARKLAYER_CLIENT_SECRET: 'secret',
      },
      {currency: 'NOK'},
    );
    const price = await pricing.getPriceForCustomer('SKU-1', {
      ...b2bCtx,
      priceListIds: [],
    });
    expect(price.gated).toBe(true);
    expect(warn).toHaveBeenCalled();
  });

  it('resolves entitled list price + breaks from Spark price-list endpoint', async () => {
    const fetchImpl = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/api/auth/token')) {
        return new Response(
          JSON.stringify({
            access_token: 'tok',
            expires_in: 3600,
            token_type: 'Bearer',
          }),
          {status: 200, headers: {'Content-Type': 'application/json'}},
        );
      }
      if (url.includes('/api/v1/price-lists/engros-a/pricing')) {
        return new Response(
          JSON.stringify([
            {sku: 'VLV-1', quantity: 1, price: 42.5},
            {sku: 'VLV-1', quantity: 20, price: 40},
            {sku: 'OTHER', quantity: 1, price: 1},
          ]),
          {status: 200, headers: {'Content-Type': 'application/json'}},
        );
      }
      return new Response('not found', {status: 404});
    });

    const pricing = createRealPricingProvider(
      {
        PUBLIC_SPARKLAYER_SITE_ID: 'site',
        SPARKLAYER_CLIENT_ID: 'id',
        SPARKLAYER_CLIENT_SECRET: 'secret',
      },
      {currency: 'NOK', fetchImpl: fetchImpl as typeof fetch},
    );

    const price = await pricing.getPriceForCustomer('VLV-1', b2bCtx);
    expect(price).toEqual({
      amount: 42.5,
      listAmount: null,
      currency: 'NOK',
      gated: false,
      demo: false,
    });

    const breaks = await pricing.getQuantityBreaks('VLV-1', b2bCtx);
    expect(breaks).toEqual([
      {minQty: 1, price: 42.5},
      {minQty: 20, price: 40},
    ]);

    // Auth + one price-list fetch (breaks reuse cache / inflight).
    const pricingCalls = fetchImpl.mock.calls.filter((c) =>
      String(c[0]).includes('/price-lists/'),
    );
    expect(pricingCalls.length).toBe(1);
  });

  it('uses automatic list rule when SKU rows are empty', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const fetchImpl = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/api/auth/token')) {
        return new Response(
          JSON.stringify({access_token: 'tok', expires_in: 3600}),
          {status: 200},
        );
      }
      if (url.endsWith('/pricing') || url.includes('/pricing')) {
        return new Response('[]', {status: 200});
      }
      if (url.includes('/api/v1/price-lists/engros-a')) {
        return new Response(
          JSON.stringify({
            slug: 'engros-a',
            rules: [
              {
                adjustment_percentage: 0.15,
                adjustment_direction: 'minus',
              },
            ],
          }),
          {status: 200},
        );
      }
      return new Response('not found', {status: 404});
    });

    const pricing = createRealPricingProvider(
      {
        PUBLIC_SPARKLAYER_SITE_ID: 'site',
        SPARKLAYER_CLIENT_ID: 'id',
        SPARKLAYER_CLIENT_SECRET: 'secret',
      },
      {currency: 'USD', fetchImpl: fetchImpl as typeof fetch},
    );

    const price = await pricing.getPriceForCustomer('1000223', b2bCtx);
    expect(price.amount).toBeNull();
    expect(price.storefrontMultiplier).toBe(0.85);
    expect(price.gated).toBe(false);
    expect(warn).toHaveBeenCalled();
  });

  it('ISOLATION: company B never receives company A price', async () => {
    const fetchImpl = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/api/auth/token')) {
        return new Response(
          JSON.stringify({access_token: 'tok', expires_in: 3600}),
          {status: 200},
        );
      }
      if (url.includes('/price-lists/engros-a/pricing')) {
        return new Response(
          JSON.stringify([{sku: 'SKU', quantity: 1, price: 10}]),
          {status: 200},
        );
      }
      if (url.includes('/price-lists/engros-b/pricing')) {
        return new Response(
          JSON.stringify([{sku: 'SKU', quantity: 1, price: 99}]),
          {status: 200},
        );
      }
      return new Response('[]', {status: 200});
    });

    const pricing = createRealPricingProvider(
      {
        PUBLIC_SPARKLAYER_SITE_ID: 'site',
        SPARKLAYER_CLIENT_ID: 'id',
        SPARKLAYER_CLIENT_SECRET: 'secret',
      },
      {currency: 'NOK', fetchImpl: fetchImpl as typeof fetch},
    );

    const forB = await pricing.getPriceForCustomer('SKU', {
      ...b2bCtx,
      customerId: 'cust-b',
      priceListIds: ['engros-b'],
    });
    expect(forB.amount).toBe(99);

    const forA = await pricing.getPriceForCustomer('SKU', {
      ...b2bCtx,
      priceListIds: ['engros-a'],
    });
    expect(forA.amount).toBe(10);
  });
});
