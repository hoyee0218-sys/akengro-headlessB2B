/* ===========================================================================
   AUTH — Shopify Customer Account API (real) + demo session (mock)
   ---------------------------------------------------------------------------
   BASELINE-BUILD §4.1: identity is Shopify's. Mock mode keeps a session stub
   so INTEGRATION_MODE=mock demos work without OAuth. Real mode uses
   context.customerAccount.login() / logout() / isLoggedIn() + identity query.

   Do NOT put Spark metafield reads only in account.tsx — resolve them here so
   every loader that calls resolveAuthedUser() gets tags + auth metafield for
   the entitlement bridge.
   ======================================================================== */
import {CUSTOMER_IDENTITY_QUERY} from '~/graphql/customer-account/CustomerIdentityQuery';
import {DEMO_COMPANY_LOCATION} from './entitlement';
import {integrationMode, type SeamEnv} from './seams';
import type {ShopifyAuthedUser} from './seams/types';
import {parseSparkPriceListIds} from './spark-pricing';

const SESSION_KEY = 'b2bDemoLoggedIn';

/** The demo buyer (Marius Hansen @ Bergen Rør & VVS) — see fixtures.ts. */
const DEMO_USER: ShopifyAuthedUser = {
  customerId: 'demo-customer-marius',
  email: 'marius@bergenror.no',
  companyLocationId: DEMO_COMPANY_LOCATION,
  tags: ['b2b'],
  sparkLayerAuthentication: 'demo-sparklayer-auth-token',
};

interface SessionLike {
  get: (key: string) => unknown;
  set: (key: string, value: unknown) => void;
  unset: (key: string) => void;
}

/** Minimal customerAccount surface used by auth (avoids importing Hydrogen types everywhere). */
export type CustomerAccountClientLike = {
  isLoggedIn: () => Promise<boolean>;
  query: (
    query: string,
    options?: {variables?: Record<string, unknown>},
  ) => Promise<{data?: unknown; errors?: Array<{message: string}>}>;
  i18n: {language: string};
};

/** @deprecated Use CustomerAccountClientLike — login/logout stay on the Hydrogen client. */
export type CustomerAccountLike = CustomerAccountClientLike & {
  login: (options?: unknown) => Promise<Response>;
  logout: () => Promise<Response>;
};

export function isDemoLoggedIn(session: SessionLike): boolean {
  return session.get(SESSION_KEY) === true;
}

/** @deprecated Prefer resolveAuthedUser — sync helper for mock/session-only paths. */
export function isLoggedIn(session: SessionLike): boolean {
  return isDemoLoggedIn(session);
}

/** @deprecated Prefer resolveAuthedUser. */
export function getAuthedUser(session: SessionLike): ShopifyAuthedUser | null {
  return isDemoLoggedIn(session) ? DEMO_USER : null;
}

export function logInDemo(session: SessionLike): void {
  session.set(SESSION_KEY, true);
}

/** @deprecated Use logInDemo — name clarified now that real login exists. */
export function logIn(session: SessionLike): void {
  logInDemo(session);
}

export function logOutDemo(session: SessionLike): void {
  session.unset(SESSION_KEY);
}

/** @deprecated Use logOutDemo. */
export function logOut(session: SessionLike): void {
  logOutDemo(session);
}

function mapCustomerToAuthedUser(customer: {
  id: string;
  tags?: string[] | null;
  emailAddress?: {emailAddress?: string | null} | null;
  sparkLayerAuthentication?: {value?: string | null} | null;
  sparkLayerPriceLists?: {value?: string | null} | null;
  sparkLayerCompanyName?: {value?: string | null} | null;
  companyContacts?: {
    nodes?: Array<{
      company?: {
        locations?: {nodes?: Array<{id: string}> | null} | null;
      } | null;
    } | null> | null;
  } | null;
}): ShopifyAuthedUser {
  const locationId =
    customer.companyContacts?.nodes?.[0]?.company?.locations?.nodes?.[0]?.id ??
    null;

  return {
    customerId: customer.id,
    email: customer.emailAddress?.emailAddress ?? undefined,
    companyLocationId: locationId,
    tags: customer.tags ?? [],
    sparkLayerAuthentication: customer.sparkLayerAuthentication?.value ?? null,
    priceListIds: parseSparkPriceListIds(
      customer.sparkLayerPriceLists?.value ?? null,
    ),
    companyName: customer.sparkLayerCompanyName?.value?.trim() || null,
  };
}

/**
 * Server-side authed user for this request.
 * - mock: demo session flag → DEMO_USER
 * - real: Customer Account session → identity query (tags + Spark metafield)
 */
export async function resolveAuthedUser(options: {
  session: SessionLike;
  customerAccount: CustomerAccountClientLike;
  env: SeamEnv;
}): Promise<ShopifyAuthedUser | null> {
  const {session, customerAccount, env} = options;

  if (integrationMode(env) !== 'real') {
    return isDemoLoggedIn(session) ? DEMO_USER : null;
  }

  const loggedIn = await customerAccount.isLoggedIn();
  if (!loggedIn) return null;

  const {data, errors} = await customerAccount.query(CUSTOMER_IDENTITY_QUERY, {
    variables: {language: customerAccount.i18n.language},
  });

  // Field-level errors (e.g. companyContacts on non-B2B Plus, metafield access)
  // must not wipe an otherwise valid Customer Account session — entitlement still
  // needs id/email/tags/metafield when present.
  if (errors?.length) {
    console.error('CustomerIdentityQuery errors', errors);
  }

  const customer = (
    data as {customer?: Parameters<typeof mapCustomerToAuthedUser>[0]} | null
  )?.customer;

  if (!customer?.id) return null;

  const user = mapCustomerToAuthedUser(customer);
  const tags = user.tags ?? [];
  const rawPriceLists = customer.sparkLayerPriceLists?.value ?? null;
  if (
    !tags.length ||
    !user.sparkLayerAuthentication ||
    !(user.priceListIds ?? []).length
  ) {
    console.warn('[auth] B2B fields incomplete from Customer Account API', {
      customerId: user.customerId,
      tags,
      hasSparkAuth: Boolean(user.sparkLayerAuthentication),
      // Admin can show price_lists while CA API returns null if the metafield
      // definition does not allow Customer Account API access.
      priceListsMetafieldPresent: rawPriceLists != null,
      priceListsMetafieldPreview:
        typeof rawPriceLists === 'string'
          ? rawPriceLists.slice(0, 80)
          : rawPriceLists,
      priceListIds: user.priceListIds ?? [],
    });
  }
  return user;
}

export async function isCustomerLoggedIn(options: {
  session: SessionLike;
  customerAccount: CustomerAccountClientLike;
  env: SeamEnv;
}): Promise<boolean> {
  if (integrationMode(options.env) !== 'real') {
    return isDemoLoggedIn(options.session);
  }
  return options.customerAccount.isLoggedIn();
}
