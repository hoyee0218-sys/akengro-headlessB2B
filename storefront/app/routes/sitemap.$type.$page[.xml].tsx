/* Sitemap child routes (BASELINE-BUILD §3.4). Real store URLs via Hydrogen getSitemap. */
import type {Route} from './+types/sitemap.$type.$page[.xml]';
import {getSitemap} from '@shopify/hydrogen';

export async function loader({
  request,
  params,
  context: {storefront},
}: Route.LoaderArgs) {
  // Match storefront i18n (context.ts): single market — no unused CA locales.
  const {language, country} = storefront.i18n;
  const locale = `${language}-${country}`;

  const response = await getSitemap({
    storefront,
    request,
    params,
    locales: [locale],
    getLink: ({type, baseUrl, handle, locale: linkLocale}) => {
      const prefix =
        linkLocale && linkLocale !== locale ? `/${linkLocale}` : '';
      const path = sitemapPath(type, handle);
      return `${baseUrl}${prefix}${path}`;
    },
  });

  response.headers.set('Cache-Control', `max-age=${60 * 60 * 24}`);

  return response;
}

/** Map Hydrogen sitemap resource types to this app's public routes. */
function sitemapPath(type: string, handle?: string): string {
  const h = handle || '';
  switch (type) {
    case 'products':
      return `/products/${h}`;
    case 'collections':
      return `/collections/${h}`;
    case 'pages':
      return `/pages/${h}`;
    case 'blogs':
      return `/blogs/${h}`;
    case 'articles':
      // Blog handle is not provided by Storefront sitemap(type: ARTICLE).
      // Prefer blogs sitemap for discovery; keep a stable product-less path.
      return `/blogs/${h}`;
    default:
      // metaObjects etc. — no public route; still emit a stable URL shape.
      return `/${type}/${h}`;
  }
}
