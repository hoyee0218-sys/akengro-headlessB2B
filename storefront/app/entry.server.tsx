import { handleRequest } from '@vercel/react-router/entry.server';
import {
  createContentSecurityPolicy,
  type HydrogenRouterContextProvider,
} from '@shopify/hydrogen';
import type { AppLoadContext, EntryContext } from 'react-router';

export default async function (
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  reactRouterContext: EntryContext,
  context: HydrogenRouterContextProvider,
) {
  const { nonce, header } = createContentSecurityPolicy({
    shop: {
      checkoutDomain: context.env.PUBLIC_CHECKOUT_DOMAIN,
      storeDomain: context.env.PUBLIC_STORE_DOMAIN,
    },
    // SparkLayer CDN + API (BASELINE §4.2). Required with Script waitForHydration.
    scriptSrc: [
      "'self'",
      'https://cdn.shopify.com',
      'https://sparkcdn.io',
      'https://cdn.sparklayer.io',
    ],
    connectSrc: [
      "'self'",
      'https://sparkcdn.io',
      'https://*.sparklayer.io',
      'https://app.sparklayer.io',
      'https://test.app.sparklayer.io',
    ],
  });

  const response = await handleRequest(
    request,
    responseStatusCode,
    responseHeaders,
    reactRouterContext,
    context as unknown as AppLoadContext,
    { nonce },
  );

  response.headers.set('Content-Security-Policy', header);

  return response;
}