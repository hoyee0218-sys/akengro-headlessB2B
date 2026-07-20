/* Resource route: update qty or remove a B2B cart line (mini-cart + checkout). */
import type {Route} from './+types/cart.update';
import {cartCount, getCart, removeLine, setLine} from '~/lib/cart';

export type CartUpdateResult =
  | {ok: true; cartCount: number; lines: ReturnType<typeof getCart>}
  | {ok: false; error: string};

export async function action({context, request}: Route.ActionArgs) {
  const form = await request.formData();
  const productId = String(form.get('productId') || '').trim();
  const intent = String(form.get('intent') || 'set');
  if (!productId) {
    return {ok: false as const, error: 'Missing product'};
  }

  if (intent === 'remove') {
    removeLine(context.session, productId);
  } else {
    const qty = parseInt(String(form.get('qty') || '0'), 10);
    if (!Number.isFinite(qty) || qty < 0) {
      return {ok: false as const, error: 'Invalid qty'};
    }
    const existing = getCart(context.session).find(
      (line) => line.productId === productId,
    );
    if (qty === 0) {
      removeLine(context.session, productId);
    } else {
      setLine(context.session, productId, qty, existing);
    }
  }

  return {
    ok: true as const,
    cartCount: cartCount(context.session),
    lines: getCart(context.session),
  } satisfies CartUpdateResult;
}

export async function loader() {
  throw new Response('Not Found', {status: 404});
}
