/**
 * Soft seam helpers for loaders. Pricing calls the live provider; on failure
 * we fail closed (gated) so PLP/PDP stay up. Account stubs still catch
 * NotImplemented until §4.5 providers are filled.
 */
import {merchantConfig} from '~/merchant.config';
import {NotImplemented} from '../entitlement';
import {gatedPrice} from '../spark-pricing';
import type {
  CustomerContext,
  PriceBreak,
  ResolvedPrice,
  Seams,
} from './types';

export function provisionalCustomerContext(
  user: {
    customerId: string;
    email?: string;
    companyLocationId?: string | null;
    companyName?: string | null;
  },
  entitlements?: {
    companyId: string;
    priceListIds: string[];
    permissions: CustomerContext['permissions'];
  },
): CustomerContext {
  const priceListIds = entitlements?.priceListIds ?? [];
  return {
    customerId: user.customerId,
    email: user.email,
    companyId: entitlements?.companyId ?? user.companyLocationId ?? user.customerId,
    companyName:
      user.companyName?.trim() || user.email || 'Bedriftskonto',
    orgnr: '—',
    priceListIds,
    priceListLabel: priceListIds[0] ?? '—',
    terms: '—',
    permissions: entitlements?.permissions ?? [],
    credit: {limit: 0, used: 0},
    demo: false,
  };
}

/** Fail-closed price when Spark is unavailable or the visitor is not entitled. */
export function realModeGatedPrice(
  currency = merchantConfig.currency,
): ResolvedPrice {
  return gatedPrice(currency);
}

export async function getPriceForCustomerSafe(
  seams: Seams,
  productId: string,
  ctx: CustomerContext | null,
): Promise<ResolvedPrice> {
  try {
    return await seams.pricing.getPriceForCustomer(productId, ctx);
  } catch (error) {
    if (!(error instanceof NotImplemented)) {
      console.error('[pricing] getPriceForCustomer failed', error);
    }
    // Entitled session + Spark outage → ungated null so PLP can overlay
    // Storefront Money instead of a misleading "log in" gate.
    if (ctx) {
      return {
        amount: null,
        listAmount: null,
        currency: merchantConfig.currency,
        gated: false,
        demo: false,
      };
    }
    return realModeGatedPrice();
  }
}

export async function getQuantityBreaksSafe(
  seams: Seams,
  variantId: string,
  ctx: CustomerContext | null,
): Promise<PriceBreak[]> {
  try {
    return await seams.pricing.getQuantityBreaks(variantId, ctx);
  } catch (error) {
    if (!(error instanceof NotImplemented)) {
      console.error('[pricing] getQuantityBreaks failed', error);
    }
    return [];
  }
}

/** Account / Spark data stubs — empty until real providers are filled in. */
export async function softAccountCall<T>(
  fn: () => Promise<T>,
  fallback: T,
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (error instanceof NotImplemented) return fallback;
    throw error;
  }
}
