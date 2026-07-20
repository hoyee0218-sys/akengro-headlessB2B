/**
 * SparkLayer runtime helpers (BASELINE §4.2).
 * Pure functions — no DOM. Used by loaders + the <SparkLayer> client component.
 */
import {isVerifiedB2BCustomer} from '~/lib/entitlement';
import type {IntegrationMode, ShopifyAuthedUser} from '~/lib/seams/types';

/** Placeholder in merchant.config until the merchant sets a real Spark site id. */
export const SPARK_PLACEHOLDER_SITE_ID = 'demo-site-id';

export type SparkSessionPayload = {
  siteId: string;
  email: string;
  authenticationToken: string;
};

/**
 * Script URL for the live SparkLayer bundle.
 * @see https://docs.sparklayer.io/tech-docs/headless
 */
export function sparkScriptUrl(siteId: string): string {
  return `https://sparkcdn.io/sparkjs/${encodeURIComponent(siteId)}/live`;
}

/**
 * Performance contract: load Spark JS only for verified B2B in real mode with
 * a real siteId. Mock / logged-out / non-B2B / placeholder siteId → zero bytes.
 */
export function shouldLoadSparkLayer(options: {
  user: ShopifyAuthedUser | null;
  siteId: string;
  integrationMode: IntegrationMode;
}): boolean {
  const {user, siteId, integrationMode} = options;
  if (integrationMode !== 'real') return false;
  if (!siteId.trim() || siteId === SPARK_PLACEHOLDER_SITE_ID) return false;
  if (!isVerifiedB2BCustomer(user)) return false;
  if (!user?.email?.trim()) return false;
  return true;
}

/**
 * Server-resolved Spark auth payload for the client component.
 * Returns null when Spark must not load (zero bytes).
 */
export function resolveSparkSession(options: {
  user: ShopifyAuthedUser | null;
  siteId: string;
  integrationMode: IntegrationMode;
}): SparkSessionPayload | null {
  if (!shouldLoadSparkLayer(options)) return null;
  const {user, siteId} = options;
  return {
    siteId,
    email: user!.email!.trim(),
    authenticationToken: user!.sparkLayerAuthentication!.trim(),
  };
}
