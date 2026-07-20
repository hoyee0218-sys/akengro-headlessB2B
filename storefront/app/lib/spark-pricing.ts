/**
 * Pure Spark → seam pricing mappers (BASELINE §4.3).
 * Authz: never return a price outside the customer's priceListIds cascade.
 */
import type {PriceBreak, ResolvedPrice} from '~/lib/seams/types';
import type {SparkPriceTier, SparkVariantPricing} from '~/lib/spark-api';

/**
 * Parse `sparklayer.price_lists` customer metafield (JSON).
 * Supports string[], objects with slug/handle, or nested `{ price_lists: [...] }`.
 */
export function parseSparkPriceListIds(
  raw: string | null | undefined,
): string[] {
  if (raw == null) return [];
  const text = String(raw).trim();
  if (!text) return [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return [text];
  }

  return normalizePriceListIds(parsed);
}

function normalizePriceListIds(value: unknown): string[] {
  if (typeof value === 'string' && value.trim()) return [value.trim()];

  if (Array.isArray(value)) {
    const out: string[] = [];
    for (const item of value) {
      if (typeof item === 'string' && item.trim()) {
        out.push(item.trim());
        continue;
      }
      if (item && typeof item === 'object') {
        const o = item as Record<string, unknown>;
        const slug = o.slug ?? o.price_list_slug ?? o.handle ?? o.id;
        if (typeof slug === 'string' && slug.trim()) out.push(slug.trim());
      }
    }
    return dedupePreserveOrder(out);
  }

  if (value && typeof value === 'object') {
    const o = value as Record<string, unknown>;
    const nested = o.price_lists ?? o.priceLists ?? o.lists ?? o.slugs;
    if (nested !== undefined) return normalizePriceListIds(nested);
    const single = o.slug ?? o.price_list_slug ?? o.handle;
    if (typeof single === 'string' && single.trim()) return [single.trim()];
  }

  return [];
}

function dedupePreserveOrder(ids: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const id of ids) {
    const key = id.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(id);
  }
  return out;
}

/**
 * Pick the first entitled price list that has tiers for this SKU
 * (Spark cascade order = order of `priceListIds`).
 */
export function selectEntitledPricing(
  rows: SparkVariantPricing[],
  priceListIds: string[],
): SparkVariantPricing | null {
  if (!rows.length || !priceListIds.length) return null;

  const bySlug = new Map<string, SparkVariantPricing>();
  for (const row of rows) {
    bySlug.set(row.price_list_slug.toLowerCase(), row);
  }

  for (const slug of priceListIds) {
    const hit = bySlug.get(slug.toLowerCase());
    if (hit?.pricing?.length) return hit;
  }
  return null;
}

export function tiersToPriceBreaks(tiers: SparkPriceTier[]): PriceBreak[] {
  return tiers
    .filter((t) => typeof t.price === 'number' && Number.isFinite(t.price))
    .map((t) => ({
      minQty: Math.max(1, Number(t.quantity) || 1),
      price: t.price,
    }))
    .sort((a, b) => a.minQty - b.minQty);
}

/** Unit price = lowest qty tier (typically qty 1). */
export function unitPriceFromTiers(tiers: SparkPriceTier[]): number | null {
  const breaks = tiersToPriceBreaks(tiers);
  return breaks[0]?.price ?? null;
}

export function gatedPrice(currency: string): ResolvedPrice {
  return {
    amount: null,
    listAmount: null,
    currency,
    gated: true,
    demo: false,
  };
}

export function resolvedPriceFromSpark(options: {
  amount: number | null;
  currency: string;
  listAmount?: number | null;
  storefrontMultiplier?: number | null;
}): ResolvedPrice {
  const {
    amount,
    currency,
    listAmount = null,
    storefrontMultiplier = null,
  } = options;
  if (amount == null) {
    return {
      amount: null,
      listAmount: null,
      currency,
      gated: false,
      demo: false,
      storefrontMultiplier,
    };
  }
  return {
    amount,
    listAmount:
      listAmount != null && listAmount !== amount ? listAmount : null,
    currency,
    gated: false,
    demo: false,
  };
}

/** Apply Spark automatic rule: Storefront × multiplier, origin as list/compare. */
export function applyStorefrontMultiplier(
  storefrontAmount: number,
  multiplier: number,
): {amount: number; listAmount: number} {
  const amount = Math.round(storefrontAmount * multiplier * 100) / 100;
  return {amount, listAmount: storefrontAmount};
}
