/* ===========================================================================
   SEAM SELECTOR (BUILD.md §5)
   ---------------------------------------------------------------------------
   Picks Mock or Real providers by env INTEGRATION_MODE (default 'mock'). This
   is the ONE place mock↔real is switched — swapping the demo for production is
   a config change, not a refactor. Import getSeams() only inside loaders/actions.
   ======================================================================== */
import {EntitlementError} from '../entitlement';
import * as mock from './mock';
import * as real from './real';
import {provisionalCustomerContext} from './safe';
import type {
  CustomerContext,
  IntegrationMode,
  Seams,
  ShopifyAuthedUser,
} from './types';

export type SeamEnv =
  | ({
      INTEGRATION_MODE?: string;
    } & real.RealPricingEnv)
  | undefined;

export function integrationMode(env: SeamEnv): IntegrationMode {
  return env?.INTEGRATION_MODE === 'real' ? 'real' : 'mock';
}

export function getSeams(env: SeamEnv): Seams {
  if (integrationMode(env) === 'real') {
    return {
      mode: 'real',
      pricing: real.createRealPricingProvider(env),
      entitlement: real.realEntitlementProvider,
      catalog: real.realCatalogProvider,
      order: real.realOrderProvider,
      account: real.realAccountDataProvider,
    };
  }
  return {
    mode: 'mock',
    pricing: mock.mockPricingProvider,
    entitlement: mock.mockEntitlementProvider,
    catalog: mock.mockCatalogProvider,
    order: mock.mockOrderProvider,
    account: mock.mockAccountDataProvider,
  };
}

/**
 * Resolve the per-request B2B context from an authed Shopify user. This is the
 * server-side gate: returns null for logged-out visitors and for customers that
 * fail B2B verification (no `b2b` tag and/or no Spark auth metafield) → gated
 * pricing. Never trust client-supplied identity here.
 */
export async function getCustomerContext(
  env: SeamEnv,
  user: ShopifyAuthedUser | null,
): Promise<CustomerContext | null> {
  if (!user) return null;
  const seams = getSeams(env);

  try {
    const ent = await seams.entitlement.resolveEntitlements(user);
    if (seams.mode === 'real') {
      return provisionalCustomerContext(user, ent);
    }
    return mock.mockCustomerContext(user, ent);
  } catch (error) {
    if (error instanceof EntitlementError) return null;
    throw error;
  }
}

export * from './types';
export {
  getPriceForCustomerSafe,
  getQuantityBreaksSafe,
  provisionalCustomerContext,
  softAccountCall,
} from './safe';
