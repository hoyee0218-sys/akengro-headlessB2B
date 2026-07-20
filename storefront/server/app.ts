import {createRequestHandler} from 'react-router';
import {storefrontRedirect} from '@shopify/hydrogen';
import {waitUntil} from '@vercel/functions';
// @ts-expect-error virtual module provided by React Router at build time
import * as build from 'virtual:react-router/server-build';
import {createHydrogenRouterContext} from '../app/lib/context';

/**
 * Vercel serverless entrypoint.
 * Supplies Hydrogen load context (storefront, session, env, cache).
 * @see https://vercel.com/docs/frameworks/frontend/react-router#using-a-custom-server-entrypoint
 */
export default async function vercelHandler(request: Request): Promise<Response> {
  try {
    const env = process.env as unknown as Env;
    const executionContext = {
      waitUntil,
      passThroughOnException() {},
    } as ExecutionContext;

    const hydrogenContext = await createHydrogenRouterContext(
      request,
      env,
      executionContext,
    );

    const handleRequest = createRequestHandler(build);
    const response = await handleRequest(request, hydrogenContext);

    if (hydrogenContext.session.isPending) {
      response.headers.set(
        'Set-Cookie',
        await hydrogenContext.session.commit(),
      );
    }

    if (response.status === 404) {
      return storefrontRedirect({
        request,
        response,
        storefront: hydrogenContext.storefront,
      });
    }

    return response;
  } catch (error) {
    console.error('[vercel] request handler failed', error);
    return new Response('An unexpected error occurred', {status: 500});
  }
}
