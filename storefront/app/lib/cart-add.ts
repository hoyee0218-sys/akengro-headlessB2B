/* Shared add-to-cart form parsing for PDP, PLP, and quick order.
   Always returns JSON — never redirect — so B2B buyers stay on the page.
   Optional snapshot fields (title/sku/amount/…) travel with the line so
   checkout can render Shopify products outside the mock catalog. */
import {
  addLine,
  cartCount,
  getCart,
  type B2BCartLine,
  type B2BCartLineMeta,
} from '~/lib/cart';

export type CartAddSuccess = {
  ok: true;
  cartCount: number;
  addedCount: number;
  lines: B2BCartLine[];
};

export type CartAddFailure = {
  ok: false;
  error: string;
};

export type CartAddResult = CartAddSuccess | CartAddFailure;

interface SessionLike {
  get: (key: string) => unknown;
  set: (key: string, value: unknown) => void;
  unset: (key: string) => void;
}

function metaFromForm(form: FormData): B2BCartLineMeta | undefined {
  const title = String(form.get('title') || '').trim();
  const sku = String(form.get('sku') || '').trim();
  const handle = String(form.get('handle') || '').trim();
  const imageUrl = String(form.get('imageUrl') || '').trim();
  const currency = String(form.get('currency') || '').trim();
  const variantTitle = String(form.get('variantTitle') || '').trim();
  const amountRaw = String(form.get('amount') || '').trim();
  const amount = amountRaw === '' ? undefined : Number(amountRaw);

  if (!title && !sku && !handle && amount == null && !variantTitle && !imageUrl) {
    return undefined;
  }

  return {
    ...(title ? {title} : {}),
    ...(sku ? {sku} : {}),
    ...(handle ? {handle} : {}),
    ...(imageUrl ? {imageUrl} : {}),
    ...(currency ? {currency} : {}),
    ...(variantTitle ? {variantTitle} : {}),
    ...(amount != null && Number.isFinite(amount) ? {amount} : {}),
  };
}

/** Apply a cart-add form payload and return a fetcher-friendly result. */
export function applyCartAdd(
  session: SessionLike,
  form: FormData,
  fallbackProductId?: string,
  lineMeta?: B2BCartLineMeta,
): CartAddResult {
  const payload = String(form.get('lines') || '');
  if (payload) {
    let addedCount = 0;
    payload
      .split(',')
      .filter(Boolean)
      .forEach((pair) => {
        const [id, qtyRaw] = pair.split(':');
        const qty = parseInt(qtyRaw, 10);
        if (id && qty > 0) {
          addLine(session, id, qty);
          addedCount += 1;
        }
      });
    if (addedCount === 0) {
      return {ok: false, error: 'No valid lines'};
    }
    return {
      ok: true,
      cartCount: cartCount(session),
      addedCount,
      lines: getCart(session),
    };
  }

  const productId =
    String(form.get('productId') || '') || fallbackProductId || '';
  const qty = parseInt(String(form.get('qty') || '1'), 10) || 1;
  if (!productId || qty < 1) {
    return {ok: false, error: 'Missing product'};
  }
  const meta = {...metaFromForm(form), ...lineMeta};
  addLine(
    session,
    productId,
    qty,
    Object.keys(meta).length > 0 ? meta : undefined,
  );
  return {
    ok: true,
    cartCount: cartCount(session),
    addedCount: 1,
    lines: getCart(session),
  };
}
