import {describe, expect, it} from 'vitest';
import {
  SPARK_PLACEHOLDER_SITE_ID,
  resolveSparkSession,
  shouldLoadSparkLayer,
  sparkScriptUrl,
} from './spark';
import type {ShopifyAuthedUser} from './seams/types';

const verified: ShopifyAuthedUser = {
  customerId: 'gid://shopify/Customer/1',
  email: 'b2b@example.com',
  tags: ['b2b'],
  sparkLayerAuthentication: 'spark-jwt-token',
};

describe('sparkScriptUrl', () => {
  it('builds the live sparkcdn URL for a site id', () => {
    expect(sparkScriptUrl('acme-b2b')).toBe(
      'https://sparkcdn.io/sparkjs/acme-b2b/live',
    );
  });
});

describe('shouldLoadSparkLayer / resolveSparkSession', () => {
  it('loads for verified B2B in real mode with a real siteId', () => {
    expect(
      shouldLoadSparkLayer({
        user: verified,
        siteId: 'acme-b2b',
        integrationMode: 'real',
      }),
    ).toBe(true);

    expect(
      resolveSparkSession({
        user: verified,
        siteId: 'acme-b2b',
        integrationMode: 'real',
      }),
    ).toEqual({
      siteId: 'acme-b2b',
      email: 'b2b@example.com',
      authenticationToken: 'spark-jwt-token',
    });
  });

  it('loads ZERO Spark bytes when logged out', () => {
    expect(
      shouldLoadSparkLayer({
        user: null,
        siteId: 'acme-b2b',
        integrationMode: 'real',
      }),
    ).toBe(false);
    expect(
      resolveSparkSession({
        user: null,
        siteId: 'acme-b2b',
        integrationMode: 'real',
      }),
    ).toBeNull();
  });

  it('loads ZERO Spark bytes for non-B2B customers', () => {
    expect(
      shouldLoadSparkLayer({
        user: {
          customerId: 'c',
          email: 'a@b.c',
          tags: [],
          sparkLayerAuthentication: null,
        },
        siteId: 'acme-b2b',
        integrationMode: 'real',
      }),
    ).toBe(false);
  });

  it('loads ZERO Spark bytes in mock mode even for verified demo users', () => {
    expect(
      shouldLoadSparkLayer({
        user: verified,
        siteId: 'acme-b2b',
        integrationMode: 'mock',
      }),
    ).toBe(false);
  });

  it('loads ZERO Spark bytes when siteId is the placeholder', () => {
    expect(
      shouldLoadSparkLayer({
        user: verified,
        siteId: SPARK_PLACEHOLDER_SITE_ID,
        integrationMode: 'real',
      }),
    ).toBe(false);
  });

  it('loads ZERO Spark bytes when email is missing', () => {
    expect(
      shouldLoadSparkLayer({
        user: {...verified, email: undefined},
        siteId: 'acme-b2b',
        integrationMode: 'real',
      }),
    ).toBe(false);
  });
});
