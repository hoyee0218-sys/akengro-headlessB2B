/* Resource loader: product + variants for the quick-add modal. */
import type {Route} from './+types/api.quick-add.$handle';
import {resolveAuthedUser} from '~/lib/auth';
import {getCustomerContext, getSeams} from '~/lib/seams';
import {loadQuickAddProduct} from '~/lib/quick-add';

export async function loader({context, params}: Route.LoaderArgs) {
  const handle = params.handle;
  if (!handle) {
    throw new Response('Missing handle', {status: 400});
  }

  const {env, session, storefront, customerAccount} = context;
  const user = await resolveAuthedUser({session, customerAccount, env});
  const ctx = await getCustomerContext(env, user);
  const seams = getSeams(env);
  const product = await loadQuickAddProduct(storefront as any, seams, ctx, handle);

  if (!product) {
    throw new Response('Not Found', {status: 404});
  }

  return {product, loggedIn: Boolean(ctx)};
}
