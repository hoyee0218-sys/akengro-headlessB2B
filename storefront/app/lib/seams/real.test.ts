/* Real-mode boundary tests (BUILD.md §9 DoD): remaining RealProviders must
   throw NotImplemented with an owner. Pricing (§4.3) and entitlement (§4.1)
   are implemented and covered in dedicated tests. */
import {describe, expect, it} from 'vitest';
import {EntitlementError, NotImplemented} from '../entitlement';
import {
  realAccountDataProvider,
  realCatalogProvider,
  realEntitlementProvider,
  realOrderProvider,
} from './real';
import {getCustomerContext} from './index';

const ctx: any = {companyId: 'x', priceListIds: [], permissions: []};

describe('RealProviders throw NotImplemented with an owner', () => {
  const calls: Array<[string, () => Promise<unknown>]> = [
    ['catalog.getProducts', () => realCatalogProvider.getProducts(ctx)],
    ['catalog.getProduct', () => realCatalogProvider.getProduct('p', ctx)],
    ['order.createOrder', () => realOrderProvider.createOrder({lines: []}, ctx)],
    ['account.getOrderHistory', () => realAccountDataProvider.getOrderHistory(ctx)],
    ['account.getQuotes', () => realAccountDataProvider.getQuotes(ctx)],
    ['account.getCredit', () => realAccountDataProvider.getCredit(ctx)],
  ];

  it.each(calls)('%s throws NotImplemented naming an owner', async (_label, fn) => {
    await expect(fn()).rejects.toBeInstanceOf(NotImplemented);
    await expect(fn()).rejects.toThrow(/owner:/);
  });
});

describe('realEntitlementProvider + getCustomerContext', () => {
  it('resolves a verified B2B customer with price lists', async () => {
    const ent = await realEntitlementProvider.resolveEntitlements({
      customerId: 'cust-1',
      tags: ['b2b'],
      sparkLayerAuthentication: 'tok',
      companyLocationId: 'loc-1',
      priceListIds: ['engros-a'],
    });
    expect(ent.companyId).toBe('loc-1');
    expect(ent.priceListIds).toEqual(['engros-a']);
  });

  it('rejects customers without b2b tag / Spark metafield', async () => {
    await expect(
      realEntitlementProvider.resolveEntitlements({
        customerId: 'cust-1',
        tags: [],
        sparkLayerAuthentication: null,
      }),
    ).rejects.toBeInstanceOf(EntitlementError);
  });

  it('getCustomerContext returns null for non-B2B in real mode', async () => {
    const ctxResult = await getCustomerContext(
      {INTEGRATION_MODE: 'real'},
      {
        customerId: 'cust-retail',
        email: 'a@b.c',
        tags: [],
        sparkLayerAuthentication: null,
      },
    );
    expect(ctxResult).toBeNull();
  });

  it('getCustomerContext returns context for verified B2B in real mode', async () => {
    const ctxResult = await getCustomerContext(
      {INTEGRATION_MODE: 'real'},
      {
        customerId: 'cust-b2b',
        email: 'b2b@example.com',
        tags: ['b2b'],
        sparkLayerAuthentication: 'spark-jwt',
        companyLocationId: 'loc-9',
        priceListIds: ['engros-a'],
        companyName: 'Acme AS',
      },
    );
    expect(ctxResult?.companyId).toBe('loc-9');
    expect(ctxResult?.email).toBe('b2b@example.com');
    expect(ctxResult?.demo).toBe(false);
    expect(ctxResult?.priceListIds).toEqual(['engros-a']);
    expect(ctxResult?.companyName).toBe('Acme AS');
  });
});
