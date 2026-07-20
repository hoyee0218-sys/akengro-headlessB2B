/**
 * SparkLayer REST client (server-side, BASELINE §4.3).
 * OAuth2 client-credentials + price-list pricing (PLP-friendly: one fetch per list).
 * @see https://docs.sparklayer.io/tech-docs/api-authentication
 * @see https://docs.sparklayer.io/tech-docs/get-pricing-by-price-list
 * @see https://docs.sparklayer.io/tech-docs/get-pricing-by-sku
 */

export const DEFAULT_SPARK_API_BASE = 'https://app.sparklayer.io';

export type SparkApiConfig = {
  siteId: string;
  clientId: string;
  clientSecret: string;
  apiBase?: string;
  /** Injectable fetch for tests. */
  fetchImpl?: typeof fetch;
};

export type SparkPriceTier = {
  quantity?: number;
  price: number;
  tax_type?: string;
  unit_of_measure?: string | null;
};

export type SparkVariantPricing = {
  price_list_slug: string;
  pricing: SparkPriceTier[];
};

type TokenCache = {
  accessToken: string;
  expiresAtMs: number;
};

type ListPricingCacheEntry = {
  expiresAtMs: number;
  /** sku (lower) → tiers */
  bySku: Map<string, SparkPriceTier[]>;
};

type ListRuleCacheEntry = {
  expiresAtMs: number;
  /** Multiply Storefront amount (e.g. 0.85 for −15%). Null if no automatic rule. */
  storefrontMultiplier: number | null;
};

/** Module-scoped token cache (Oxygen isolate lifetime). */
let tokenCache: TokenCache | null = null;

/** Price-list → SKU map cache (avoids N×SKU storms on PLP). */
const listPricingCache = new Map<string, ListPricingCacheEntry>();
const listPricingInflight = new Map<
  string,
  Promise<Map<string, SparkPriceTier[]>>
>();
const listRuleCache = new Map<string, ListRuleCacheEntry>();
const listRuleInflight = new Map<string, Promise<number | null>>();

const LIST_CACHE_TTL_MS = 60_000;

export function clearSparkTokenCache(): void {
  tokenCache = null;
  listPricingCache.clear();
  listPricingInflight.clear();
  listRuleCache.clear();
  listRuleInflight.clear();
}

export function isSparkApiConfigured(
  config: Partial<SparkApiConfig> | null | undefined,
): config is SparkApiConfig {
  return Boolean(
    config?.siteId?.trim() &&
      config?.clientId?.trim() &&
      config?.clientSecret?.trim(),
  );
}

function apiBase(config: SparkApiConfig): string {
  return (config.apiBase?.trim() || DEFAULT_SPARK_API_BASE).replace(/\/$/, '');
}

function http(config: SparkApiConfig): typeof fetch {
  return config.fetchImpl ?? fetch;
}

function listCacheKey(config: SparkApiConfig, slug: string): string {
  return `${apiBase(config)}|${config.siteId}|${slug.toLowerCase()}`;
}

async function withRetry<T>(
  label: string,
  fn: () => Promise<T>,
  attempts = 3,
): Promise<T> {
  let last: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (error) {
      last = error;
      const msg = error instanceof Error ? error.message : String(error);
      const retryable =
        /network connection lost|fetch failed|ECONNRESET|ETIMEDOUT|socket/i.test(
          msg,
        );
      if (!retryable || i === attempts - 1) throw error;
      await new Promise((r) => setTimeout(r, 150 * (i + 1)));
      console.warn(`[spark-api] retry ${i + 1}/${attempts - 1} after ${label}:`, msg);
    }
  }
  throw last;
}

async function authorizedFetch(
  config: SparkApiConfig,
  path: string,
  init?: RequestInit,
): Promise<Response> {
  const token = await fetchAccessToken(config);
  return http(config)(`${apiBase(config)}${path}`, {
    ...init,
    method: init?.method ?? 'GET',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'Site-Id': config.siteId,
      Authorization: `Bearer ${token}`,
      'User-Agent': `akengro-headlessB2B/${config.siteId}`,
      ...(init?.headers ?? {}),
    },
  });
}

async function fetchAccessToken(config: SparkApiConfig): Promise<string> {
  const now = Date.now();
  if (tokenCache && tokenCache.expiresAtMs > now + 60_000) {
    return tokenCache.accessToken;
  }

  return withRetry('auth', async () => {
    const res = await http(config)(`${apiBase(config)}/api/auth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'Site-Id': config.siteId,
        'User-Agent': `akengro-headlessB2B/${config.siteId}`,
      },
      body: JSON.stringify({
        grant_type: 'client_credentials',
        client_id: config.clientId,
        client_secret: config.clientSecret,
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(
        `SparkLayer auth failed (${res.status}): ${body.slice(0, 200)}`,
      );
    }

    const json = (await res.json()) as {
      access_token?: string;
      expires_in?: number;
    };
    if (!json.access_token) {
      throw new Error('SparkLayer auth response missing access_token');
    }

    const expiresInSec = Number(json.expires_in) || 3600;
    tokenCache = {
      accessToken: json.access_token,
      expiresAtMs: Date.now() + expiresInSec * 1000,
    };
    return json.access_token;
  });
}

function indexPriceListRows(
  rows: Array<{
    sku?: string;
    quantity?: number;
    price?: number;
    unit_of_measure?: string | null;
  }>,
): Map<string, SparkPriceTier[]> {
  const bySku = new Map<string, SparkPriceTier[]>();
  for (const row of rows) {
    const sku = row.sku?.trim();
    if (!sku || typeof row.price !== 'number' || !Number.isFinite(row.price)) {
      continue;
    }
    const key = sku.toLowerCase();
    const tier: SparkPriceTier = {
      quantity: row.quantity,
      price: row.price,
      unit_of_measure: row.unit_of_measure,
    };
    const existing = bySku.get(key);
    if (existing) existing.push(tier);
    else bySku.set(key, [tier]);
  }
  return bySku;
}

/**
 * GET /api/v1/price-lists/{slug}/pricing — all SKUs on one list.
 * Cached + in-flight deduped so a PLP does one request per list, not per product.
 */
export async function fetchPricingByPriceList(
  config: SparkApiConfig,
  priceListSlug: string,
): Promise<Map<string, SparkPriceTier[]>> {
  const slug = priceListSlug.trim();
  if (!slug) return new Map();

  const key = listCacheKey(config, slug);
  const now = Date.now();
  const cached = listPricingCache.get(key);
  if (cached && cached.expiresAtMs > now) {
    return cached.bySku;
  }

  const inflight = listPricingInflight.get(key);
  if (inflight) return inflight;

  const promise = withRetry(`price-list ${slug}`, async () => {
    const res = await authorizedFetch(
      config,
      `/api/v1/price-lists/${encodeURIComponent(slug)}/pricing`,
    );

    if (res.status === 204 || res.status === 404) {
      return new Map<string, SparkPriceTier[]>();
    }
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(
        `SparkLayer price-list pricing failed for ${slug} (${res.status}): ${body.slice(0, 200)}`,
      );
    }

    const json = (await res.json()) as unknown;
    if (!Array.isArray(json)) return new Map<string, SparkPriceTier[]>();
    return indexPriceListRows(
      json as Array<{
        sku?: string;
        quantity?: number;
        price?: number;
        unit_of_measure?: string | null;
      }>,
    );
  })
    .then((bySku) => {
      listPricingCache.set(key, {
        bySku,
        expiresAtMs: Date.now() + LIST_CACHE_TTL_MS,
      });
      return bySku;
    })
    .finally(() => {
      listPricingInflight.delete(key);
    });

  listPricingInflight.set(key, promise);
  return promise;
}

/**
 * Resolve tiers for a SKU across entitled lists (cascade = priceListIds order).
 * Does NOT call per-SKU pricing when the list payload is empty — automatic
 * Shopify-sourced lists often have zero materialized rows (use list rules instead).
 */
export async function fetchEntitledTiersForSku(
  config: SparkApiConfig,
  sku: string,
  priceListIds: string[],
): Promise<SparkPriceTier[] | null> {
  const trimmed = sku.trim();
  if (!trimmed || !priceListIds.length) return null;

  const skuKey = trimmed.toLowerCase();

  for (const slug of priceListIds) {
    const bySku = await fetchPricingByPriceList(config, slug);
    const tiers = bySku.get(skuKey);
    if (tiers?.length) return tiers;
  }

  return null;
}

/**
 * GET /api/v1/price-lists/{slug} — automatic adjustment rule → Storefront multiplier.
 * e.g. decrease 15% → 0.85
 */
export async function fetchStorefrontMultiplierForLists(
  config: SparkApiConfig,
  priceListIds: string[],
): Promise<number | null> {
  for (const slug of priceListIds) {
    const multiplier = await fetchStorefrontMultiplierForList(config, slug);
    if (multiplier != null) return multiplier;
  }
  return null;
}

export async function fetchStorefrontMultiplierForList(
  config: SparkApiConfig,
  priceListSlug: string,
): Promise<number | null> {
  const slug = priceListSlug.trim();
  if (!slug) return null;

  const key = listCacheKey(config, slug);
  const now = Date.now();
  const cached = listRuleCache.get(key);
  if (cached && cached.expiresAtMs > now) {
    return cached.storefrontMultiplier;
  }

  const inflight = listRuleInflight.get(key);
  if (inflight) return inflight;

  const promise = withRetry(`price-list meta ${slug}`, async () => {
    const res = await authorizedFetch(
      config,
      `/api/v1/price-lists/${encodeURIComponent(slug)}`,
    );
    if (res.status === 404) return null;
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(
        `SparkLayer price-list meta failed for ${slug} (${res.status}): ${body.slice(0, 200)}`,
      );
    }
    const json = (await res.json()) as {
      rules?: Array<{
        adjustment_percentage?: number;
        adjustment_direction?: string;
      }>;
      data?: {
        rules?: Array<{
          adjustment_percentage?: number;
          adjustment_direction?: string;
        }>;
      };
    };
    const rules = json.rules ?? json.data?.rules ?? [];
    return multiplierFromRules(rules);
  })
    .then((storefrontMultiplier) => {
      listRuleCache.set(key, {
        storefrontMultiplier,
        expiresAtMs: Date.now() + LIST_CACHE_TTL_MS,
      });
      return storefrontMultiplier;
    })
    .finally(() => {
      listRuleInflight.delete(key);
    });

  listRuleInflight.set(key, promise);
  return promise;
}

export function multiplierFromRules(
  rules: Array<{
    adjustment_percentage?: number;
    adjustment_direction?: string;
  }>,
): number | null {
  for (const rule of rules) {
    const pct = Number(rule.adjustment_percentage);
    if (!Number.isFinite(pct) || pct < 0) continue;
    const dir = (rule.adjustment_direction ?? 'minus').toLowerCase();
    if (dir === 'plus' || dir === 'increase' || dir === 'add') {
      return 1 + pct;
    }
    // minus / decrease / subtract / default
    return Math.max(0, 1 - pct);
  }
  return null;
}

/**
 * GET /api/v1/pricing/{sku} — all price lists that contain this SKU.
 * Prefer fetchEntitledTiersForSku / fetchPricingByPriceList on PLP.
 */
export async function fetchPricingBySku(
  config: SparkApiConfig,
  sku: string,
): Promise<SparkVariantPricing[]> {
  const trimmed = sku.trim();
  if (!trimmed) return [];

  return withRetry(`pricing sku ${trimmed}`, async () => {
    const res = await authorizedFetch(
      config,
      `/api/v1/pricing/${encodeURIComponent(trimmed)}`,
    );

    if (res.status === 404) return [];
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(
        `SparkLayer pricing failed for SKU ${trimmed} (${res.status}): ${body.slice(0, 200)}`,
      );
    }

    const json = (await res.json()) as unknown;
    if (!Array.isArray(json)) return [];
    return json.filter(
      (row): row is SparkVariantPricing =>
        Boolean(
          row &&
            typeof row === 'object' &&
            typeof (row as SparkVariantPricing).price_list_slug === 'string' &&
            Array.isArray((row as SparkVariantPricing).pricing),
        ),
    );
  });
}
