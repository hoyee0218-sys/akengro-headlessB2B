/* ===========================================================================
   ENTITLEMENT BRIDGE TESTS (BUILD.md §6 / BASELINE §4.1)
   ---------------------------------------------------------------------------
   The hard authz boundary is fleet-critical: one bug here replicates across
   every merchant fork. These tests pin B2B verification + cross-customer
   ISOLATION — a customer must never resolve to another company's lists.
   ======================================================================== */
import {describe, expect, it} from 'vitest';
import {
  DEMO_COMPANY_LOCATION,
  EntitlementError,
  can,
  hasB2BCustomerTag,
  hasSparkLayerAuthentication,
  isVerifiedB2BCustomer,
  resolveEntitlementsForUser,
  resolveRealEntitlementsForUser,
} from './entitlement';
import type {ShopifyAuthedUser} from './seams/types';

const b2bCreds = {
  tags: ['b2b'],
  sparkLayerAuthentication: 'spark-auth-token',
};

const bergen: ShopifyAuthedUser = {
  customerId: 'cust-1',
  email: 'marius@bergenror.no',
  companyLocationId: 'loc-bergen',
  ...b2bCreds,
};

const oslo: ShopifyAuthedUser = {
  customerId: 'cust-2',
  email: 'buyer@oslovvs.no',
  companyLocationId: 'loc-oslo',
  ...b2bCreds,
};

describe('B2B verification (tag + Spark metafield)', () => {
  it('isVerifiedB2BCustomer requires both tag and metafield', () => {
    expect(isVerifiedB2BCustomer(bergen)).toBe(true);
    expect(
      isVerifiedB2BCustomer({
        customerId: 'c',
        tags: ['b2b'],
        sparkLayerAuthentication: null,
      }),
    ).toBe(false);
    expect(
      isVerifiedB2BCustomer({
        customerId: 'c',
        tags: [],
        sparkLayerAuthentication: 'tok',
      }),
    ).toBe(false);
    expect(isVerifiedB2BCustomer(null)).toBe(false);
  });

  it('matches the b2b tag case-insensitively', () => {
    expect(hasB2BCustomerTag({customerId: 'c', tags: ['B2B']})).toBe(true);
    expect(hasB2BCustomerTag({customerId: 'c', tags: ['retail']})).toBe(false);
  });

  it('rejects blank Spark authentication values', () => {
    expect(
      hasSparkLayerAuthentication({
        customerId: 'c',
        sparkLayerAuthentication: '   ',
      }),
    ).toBe(false);
  });
});

describe('resolveEntitlementsForUser (mock)', () => {
  it('resolves the Bergen company to its own price list + full permissions', () => {
    const ent = resolveEntitlementsForUser(bergen);
    expect(ent.companyId).toBe('bergen-ror');
    expect(ent.priceListIds).toEqual(['engros-a']);
    expect(ent.permissions).toContain('approval:manage');
    expect(ent.permissions).toContain('users:manage');
  });

  it('resolves the Oslo company to its own price list + buyer permissions', () => {
    const ent = resolveEntitlementsForUser(oslo);
    expect(ent.companyId).toBe('oslo-vvs');
    expect(ent.priceListIds).toEqual(['engros-b']);
  });

  it('ISOLATION: one company never receives another company price list', () => {
    const a = resolveEntitlementsForUser(bergen);
    const b = resolveEntitlementsForUser(oslo);
    expect(a.companyId).not.toBe(b.companyId);
    const overlap = a.priceListIds.filter((id) => b.priceListIds.includes(id));
    expect(overlap).toEqual([]);
  });

  it('ISOLATION: Oslo buyer cannot manage users/approvals (no privilege leak)', () => {
    const ent = resolveEntitlementsForUser(oslo);
    expect(can(ent, 'users:manage')).toBe(false);
    expect(can(ent, 'approval:manage')).toBe(false);
    expect(can(ent, 'order:create')).toBe(true);
  });

  it('returned arrays are copies — callers cannot mutate the directory', () => {
    const ent = resolveEntitlementsForUser(bergen);
    ent.priceListIds.push('engros-b');
    ent.permissions.length = 0;
    const fresh = resolveEntitlementsForUser(bergen);
    expect(fresh.priceListIds).toEqual(['engros-a']);
    expect(fresh.permissions.length).toBeGreaterThan(0);
  });

  it('falls back to the demo company location when identity omits it', () => {
    const ent = resolveEntitlementsForUser({
      customerId: 'cust-3',
      ...b2bCreds,
    });
    expect(ent.companyId).toBe('bergen-ror');
    expect(DEMO_COMPANY_LOCATION).toBe('loc-bergen');
  });

  it('throws when there is no authenticated customer', () => {
    expect(() => resolveEntitlementsForUser({} as ShopifyAuthedUser)).toThrow(
      EntitlementError,
    );
  });

  it('throws when missing b2b tag', () => {
    expect(() =>
      resolveEntitlementsForUser({
        customerId: 'cust-x',
        companyLocationId: 'loc-bergen',
        tags: [],
        sparkLayerAuthentication: 'tok',
      }),
    ).toThrow(/b2b/i);
  });

  it('throws when missing Spark authentication metafield', () => {
    expect(() =>
      resolveEntitlementsForUser({
        customerId: 'cust-x',
        companyLocationId: 'loc-bergen',
        tags: ['b2b'],
        sparkLayerAuthentication: null,
      }),
    ).toThrow(/sparklayer\.authentication/i);
  });

  it('throws when authenticated but not a member of a known B2B location', () => {
    expect(() =>
      resolveEntitlementsForUser({
        customerId: 'cust-x',
        companyLocationId: 'loc-unknown',
        ...b2bCreds,
      }),
    ).toThrow(EntitlementError);
  });
});

describe('resolveRealEntitlementsForUser', () => {
  it('returns identity-scoped entitlements for a verified B2B customer', () => {
    const ent = resolveRealEntitlementsForUser({
      customerId: 'gid://shopify/Customer/1',
      companyLocationId: 'gid://shopify/CompanyLocation/9',
      tags: ['b2b'],
      sparkLayerAuthentication: 'eyJhbGciOi...',
      priceListIds: ['engros-a'],
    });
    expect(ent.companyId).toBe('gid://shopify/CompanyLocation/9');
    expect(ent.priceListIds).toEqual(['engros-a']);
    expect(ent.permissions).toContain('order:create');
    expect(ent.permissions).not.toContain('users:manage');
  });

  it('ISOLATION: company A price lists never leak to company B', () => {
    const a = resolveRealEntitlementsForUser({
      customerId: 'cust-a',
      companyLocationId: 'loc-a',
      tags: ['b2b'],
      sparkLayerAuthentication: 'tok',
      priceListIds: ['engros-a'],
    });
    const b = resolveRealEntitlementsForUser({
      customerId: 'cust-b',
      companyLocationId: 'loc-b',
      tags: ['b2b'],
      sparkLayerAuthentication: 'tok',
      priceListIds: ['engros-b'],
    });
    expect(a.priceListIds).not.toContain('engros-b');
    expect(b.priceListIds).not.toContain('engros-a');
  });

  it('ISOLATION: two verified customers do not share companyId when locations differ', () => {
    const a = resolveRealEntitlementsForUser({
      customerId: 'cust-a',
      companyLocationId: 'loc-a',
      ...b2bCreds,
    });
    const b = resolveRealEntitlementsForUser({
      customerId: 'cust-b',
      companyLocationId: 'loc-b',
      ...b2bCreds,
    });
    expect(a.companyId).not.toBe(b.companyId);
  });

  it('rejects non-B2B customers (no context path)', () => {
    expect(() =>
      resolveRealEntitlementsForUser({
        customerId: 'cust-retail',
        tags: ['newsletter'],
        sparkLayerAuthentication: null,
      }),
    ).toThrow(EntitlementError);
  });
});
