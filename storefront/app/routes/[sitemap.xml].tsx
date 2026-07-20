/* Sitemap index (BASELINE-BUILD §3.4). Child sitemaps for indexable storefront routes. */
import type {Route} from './+types/[sitemap.xml]';
import {getSitemapIndex} from '@shopify/hydrogen';

export async function loader({
  request,
  context: {storefront},
}: Route.LoaderArgs) {
  // Only types with matching storefront routes. Skip metaObjects (no public
  // route) and articles (Hydrogen sitemap API omits blog handle; articles are
  // reachable under /blogs/:blogHandle/:articleHandle via the blogs sitemap).
  const response = await getSitemapIndex({
    storefront,
    request,
    types: ['products', 'collections', 'pages', 'blogs'],
  });

  response.headers.set('Cache-Control', `max-age=${60 * 60 * 24}`);

  return response;
}
