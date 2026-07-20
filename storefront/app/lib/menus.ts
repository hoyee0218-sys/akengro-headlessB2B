/* Shopify navigation menus (BASELINE-BUILD §3.2).
   Handles come from merchant.config; link titles/URLs from Admin menus. */
import {HEADER_QUERY, FOOTER_QUERY} from '~/lib/fragments';
import {catalogPath} from '~/lib/format';
import {t} from '~/lib/copy';
import type {MerchantConfig} from '~/merchant.config';

export type MenuNavItem = {
  id: string;
  title: string;
  url: string;
  items: MenuNavItem[];
};

type StorefrontClient = {
  query: (query: string, options?: Record<string, unknown>) => Promise<any>;
  CacheLong?: () => unknown;
  CacheShort?: () => unknown;
  CacheNone?: () => unknown;
};

/** Short CDN/subrequest cache — menus rarely change mid-session. */
function storefrontCache(storefront: StorefrontClient): unknown {
  return (
    storefront.CacheShort?.() ??
    storefront.CacheLong?.() ??
    storefront.CacheNone?.()
  );
}

type RawMenuItem = {
  id?: string | null;
  title?: string | null;
  url?: string | null;
  items?: RawMenuItem[] | null;
};

/** Map an absolute Shopify menu URL to an in-app path. */
export function normalizeMenuUrl(url: string | null | undefined): string {
  if (!url) return '/';
  try {
    const parsed = new URL(url);
    return `${parsed.pathname}${parsed.search}` || '/';
  } catch {
    return url.startsWith('/') ? url : `/${url}`;
  }
}

/** Flatten Shopify menu items into nav nodes (one nested level). */
export function mapMenuItems(
  items: RawMenuItem[] | null | undefined,
): MenuNavItem[] {
  return (items ?? [])
    .filter((item) => Boolean(item?.title?.trim()))
    .map((item, index) => ({
      id: item.id || `menu-item-${index}`,
      title: String(item.title).trim(),
      url: normalizeMenuUrl(item.url),
      items: mapMenuItems(item.items),
    }));
}

/** Minimal header fallback when Admin menu is missing/empty. */
export function defaultHeaderNav(): MenuNavItem[] {
  return [
    {
      id: 'fallback-catalog',
      title: t('nav.catalog'),
      url: catalogPath(),
      items: [],
    },
  ];
}

/** Load header menu by configured handle. */
export async function loadHeaderMenu(
  storefront: StorefrontClient,
  config: Pick<MerchantConfig, 'headerMenuHandle'>,
): Promise<{shop: any; menu: MenuNavItem[]; headerQuery: any | null}> {
  const handle = config.headerMenuHandle?.trim() || 'main-menu';
  try {
    const headerQuery = await storefront.query(HEADER_QUERY, {
      variables: {headerMenuHandle: handle},
      cache: storefrontCache(storefront),
    });
    const menu = mapMenuItems(headerQuery?.menu?.items);
    // Wrong/missing handle → empty menu (fail gracefully, do not invent links).
    return {
      shop: headerQuery?.shop ?? null,
      menu,
      headerQuery,
    };
  } catch {
    return {shop: null, menu: [], headerQuery: null};
  }
}

/** Load footer menu by configured handle (empty array if missing). */
export async function loadFooterMenu(
  storefront: StorefrontClient,
  config: Pick<MerchantConfig, 'footerMenuHandle'>,
): Promise<MenuNavItem[]> {
  const handle = config.footerMenuHandle?.trim() || 'footer';
  try {
    const footerQuery = await storefront.query(FOOTER_QUERY, {
      variables: {footerMenuHandle: handle},
      cache: storefrontCache(storefront),
    });
    return mapMenuItems(footerQuery?.menu?.items);
  } catch {
    return [];
  }
}
