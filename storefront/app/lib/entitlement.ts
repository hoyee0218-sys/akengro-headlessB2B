/* ===========================================================================
   ENTITLEMENT BRIDGE (BUILD.md §6 / BASELINE §4.1 — the differentiator)
   ---------------------------------------------------------------------------
   ONE resolution path: shopifyAuthedUser → sparkLayerEntitlements. This lives
   in core so every merchant fork inherits a correct, tested access boundary —
   one bug here would replicate across every merchant. It is the single most
   important thing to test (see entitlement.test.ts).

   HARD AUTHZ BOUNDARY (fleet-critical): this runs server-side only (loaders /
   actions). A customer must NEVER resolve to another company's price lists,
   orders, or quotes. Never trust client-supplied identity here.

   B2B verification (SparkLayer headless contract):
     (a) customer tag `b2b`
     (b) metafield sparklayer.authentication populated
   ======================================================================== */
import type {Entitlements, Permission, ShopifyAuthedUser} from './seams/types';

/** Raised by RealProviders and by this bridge when identity is missing/invalid. */
export class NotImplemented extends Error {
  constructor(owner: string, detail: string) {
    super(`NotImplemented [owner: ${owner}] — ${detail}`);
    this.name = 'NotImplemented';
  }
}

export class EntitlementError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EntitlementError';
  }
}

/** SparkLayer / BASELINE §4.1 — required customer tag for B2B access. */
export const B2B_CUSTOMER_TAG = 'b2b';

const ALL_PERMISSIONS: Permission[] = [
  'order:create',
  'order:view',
  'quote:request',
  'quote:convert',
  'approval:manage',
  'users:manage',
  'credit:view',
];

const BUYER_PERMISSIONS: Permission[] = [
  'order:create',
  'order:view',
  'quote:request',
  'credit:view',
];

/* Demo entitlement directory. In real mode company → price-list mapping comes
   from SparkLayer (ERP-synced). Two companies are modelled so the isolation
   boundary is real and testable: a Bergen buyer must never see Oslo's list. */
interface CompanyEntitlement {
  companyId: string;
  priceListIds: string[];
  permissions: Permission[];
}

const COMPANY_DIRECTORY: Record<string, CompanyEntitlement> = {
  'loc-bergen': {
    companyId: 'bergen-ror',
    priceListIds: ['engros-a'],
    permissions: ALL_PERMISSIONS,
  },
  'loc-oslo': {
    companyId: 'oslo-vvs',
    priceListIds: ['engros-b'],
    permissions: BUYER_PERMISSIONS,
  },
};

/** The company location used for the demo session when none is supplied by the
 *  (mock) identity provider — keeps the demo populated as Bergen Rør & VVS. */
export const DEMO_COMPANY_LOCATION = 'loc-bergen';

/** Case-insensitive match for the required `b2b` customer tag. */
export function hasB2BCustomerTag(user: ShopifyAuthedUser): boolean {
  const tags = user.tags ?? [];
  return tags.some(
    (tag) => tag.trim().toLowerCase() === B2B_CUSTOMER_TAG,
  );
}

/** SparkLayer auth handshake metafield must be non-empty. */
export function hasSparkLayerAuthentication(user: ShopifyAuthedUser): boolean {
  return Boolean(user.sparkLayerAuthentication?.trim());
}

/**
 * SparkLayer headless B2B contract: tag `b2b` + sparklayer.authentication.
 * Used by loaders/Spark init — never trust client-supplied identity for this.
 */
export function isVerifiedB2BCustomer(user: ShopifyAuthedUser | null): boolean {
  if (!user?.customerId) return false;
  return hasB2BCustomerTag(user) && hasSparkLayerAuthentication(user);
}

/**
 * @throws EntitlementError when the customer fails B2B verification.
 */
export function assertVerifiedB2BCustomer(user: ShopifyAuthedUser): void {
  if (!user?.customerId) {
    throw new EntitlementError(
      'No authenticated customer — cannot resolve entitlements.',
    );
  }
  if (!hasB2BCustomerTag(user)) {
    throw new EntitlementError(
      `Customer ${user.customerId} is missing the required "${B2B_CUSTOMER_TAG}" tag.`,
    );
  }
  if (!hasSparkLayerAuthentication(user)) {
    throw new EntitlementError(
      `Customer ${user.customerId} is missing sparklayer.authentication metafield.`,
    );
  }
}

/**
 * Mock entitlement bridge: B2B verification → company directory lookup.
 *
 * @throws EntitlementError when not verified B2B or unknown company location.
 */
export function resolveEntitlementsForUser(user: ShopifyAuthedUser): Entitlements {
  assertVerifiedB2BCustomer(user);

  const locationId = user.companyLocationId || DEMO_COMPANY_LOCATION;
  const company = COMPANY_DIRECTORY[locationId];

  if (!company) {
    throw new EntitlementError(
      `Customer ${user.customerId} is not a member of a known B2B company location.`,
    );
  }

  return {
    companyId: company.companyId,
    priceListIds: [...company.priceListIds],
    permissions: [...company.permissions],
  };
}

/**
 * Real entitlement bridge (BASELINE §4.1 / §4.3): verify B2B tag + Spark auth
 * metafield, then scope price lists from `sparklayer.price_lists` (server-side).
 *
 * @throws EntitlementError when not a verified B2B customer.
 */
export function resolveRealEntitlementsForUser(
  user: ShopifyAuthedUser,
): Entitlements {
  assertVerifiedB2BCustomer(user);

  return {
    companyId: user.companyLocationId ?? user.customerId,
    priceListIds: [...(user.priceListIds ?? [])],
    permissions: [...BUYER_PERMISSIONS],
  };
}

/** True if the resolved entitlements grant a given permission. */
export function can(entitlements: Entitlements, permission: Permission): boolean {
  return entitlements.permissions.includes(permission);
}
