/* Norwegian formatting helpers (BUILD.md content fundamentals): space thousands
   separator, comma decimal, currency symbols via Intl narrowSymbol, tabular
   figures via mono. */
import {merchantConfig} from '~/merchant.config';

type MoneyFormatOptions = {
  /** ISO 4217 code from Storefront MoneyV2.currencyCode (store/market). */
  currency?: string;
  locale?: string;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
};

/** Nordic currencies — symbol after the amount: `4 500,00 kr`. */
const SUFFIX_CURRENCY_SYMBOLS = new Set(['NOK', 'SEK', 'DKK', 'ISK']);

/**
 * Whether the narrow symbol should prefix the amount (`$4 500` / `€4 500`).
 * Nordic codes suffix (`4 500 kr`); all other store currencies prefix.
 */
export function currencySymbolPrefixed(currency: string): boolean {
  return !SUFFIX_CURRENCY_SYMBOLS.has(currency.toUpperCase());
}

/**
 * Format an amount with a narrow currency symbol in the conventional position:
 * `$4 500,00` / `€4 500,00` / `4 500,00 kr`.
 * Number grouping/decimals follow `locale` (merchant); `currency` must be the
 * ISO code from the storefront MoneyV2 field (not a hardcoded shop default alone).
 */
export function formatMoney(
  amount: number,
  {
    currency = merchantConfig.currency,
    locale = merchantConfig.locale,
    minimumFractionDigits = 2,
    maximumFractionDigits,
  }: MoneyFormatOptions = {},
): string {
  const code = currency.toUpperCase();
  const fractionDigits = maximumFractionDigits ?? minimumFractionDigits;

  try {
    const number = new Intl.NumberFormat(locale, {
      minimumFractionDigits,
      maximumFractionDigits: fractionDigits,
    }).format(amount);

    const symbol = currencySymbol(code, locale);
    if (currencySymbolPrefixed(code)) {
      return `${symbol}${number}`;
    }
    return `${number}\u00A0${symbol}`;
  } catch {
    return `${amount.toFixed(minimumFractionDigits)} ${code}`;
  }
}

/** Narrow currency symbol for labels (price inputs, etc.). */
export function currencySymbol(
  currency = merchantConfig.currency,
  locale = merchantConfig.locale,
): string {
  const code = currency.toUpperCase();
  try {
    // Prefer a locale that yields a real glyph ($, €) rather than the ISO code.
    const symbolLocale = currencySymbolPrefixed(code) ? 'en-US' : locale;
    const part = new Intl.NumberFormat(symbolLocale, {
      style: 'currency',
      currency: code,
      currencyDisplay: 'narrowSymbol',
    })
      .formatToParts(0)
      .find((entry) => entry.type === 'currency');
    const value = part?.value ?? code;
    if (value.toUpperCase() === code && symbolLocale !== 'en-US') {
      const fallback = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: code,
        currencyDisplay: 'narrowSymbol',
      })
        .formatToParts(0)
        .find((entry) => entry.type === 'currency');
      return fallback?.value ?? code;
    }
    return value;
  } catch {
    return code;
  }
}

export function money(n: number, minimumFractionDigits = 0): string {
  return formatMoney(n, {minimumFractionDigits});
}

/** Category ↔ collection handle. B2B catalogs are entitlement-scoped, but the
 *  category label → handle mapping is stable, so we derive it deterministically. */
export function categoryToHandle(category: string): string {
  return category.toLowerCase().replace(/\s+/g, '-');
}

export function handleToCategory(handle: string, categories: string[]): string | null {
  return categories.find((c) => categoryToHandle(c) === handle) ?? null;
}

/** PDP path for a product (handle = stable product id from the catalog seam). */
export function productPath(
  id: string,
  options?: {collection?: string | null},
): string {
  const base = `/products/${id}`;
  const collection = options?.collection?.trim();
  if (!collection) return base;
  const params = new URLSearchParams();
  params.set('collection', collection);
  return `${base}?${params.toString()}`;
}

/** Full-catalog PLP path — uses merchantConfig.catalogCollectionHandle. */
export function catalogPath(): string {
  return `/collections/${merchantConfig.catalogCollectionHandle}`;
}

/** Pseudo-handles that should resolve to the merchant catalog collection. */
export function isCatalogAlias(handle: string): boolean {
  return handle === 'all' || handle === 'alle';
}

/** Resolve URL handle → Shopify collection handle for the catalog PLP. */
export function resolveCollectionHandle(handle: string): string {
  if (isCatalogAlias(handle)) {
    return merchantConfig.catalogCollectionHandle;
  }
  return handle;
}

export type BreadcrumbCollection = {
  title: string;
  handle: string;
};

function isCatalogCollectionHandle(handle: string): boolean {
  return (
    handle === merchantConfig.catalogCollectionHandle || isCatalogAlias(handle)
  );
}

/**
 * Pick the Shopify collection for PDP breadcrumbs.
 * Prefers `?collection=` when it matches a product membership (PLP context),
 * otherwise the first non-catalog collection. Links use Admin collection handles
 * (`/collections/{handle}`), never a slugified productType.
 */
export function resolveProductBreadcrumbCollection(options: {
  collections: BreadcrumbCollection[];
  preferredHandle?: string | null;
}): BreadcrumbCollection | null {
  const collections = options.collections.filter(
    (entry) => entry.handle && entry.title,
  );
  if (!collections.length) return null;

  const preferred = options.preferredHandle?.trim();
  if (preferred) {
    const match = collections.find((entry) => entry.handle === preferred);
    if (match && !isCatalogCollectionHandle(match.handle)) {
      return match;
    }
  }

  return (
    collections.find((entry) => !isCatalogCollectionHandle(entry.handle)) ??
    null
  );
}
