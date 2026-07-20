/* Resource route: add line(s) to the B2B session cart without navigation.
   Used by listing cards and any client that posts via useFetcher. */
import type {Route} from './+types/cart.add';
import {applyCartAdd} from '~/lib/cart-add';

export async function action({context, request}: Route.ActionArgs) {
  const form = await request.formData();
  return applyCartAdd(context.session, form);
}

export async function loader() {
  throw new Response('Not Found', {status: 404});
}
