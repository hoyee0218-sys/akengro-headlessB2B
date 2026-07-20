/* ===========================================================================
   B2B CART (session-backed stand-in for the SparkLayer cart — BUILD.md §5)
   ---------------------------------------------------------------------------
   Add-to-cart MUST target the B2B cart, not the default Storefront cart. In
   production this routes through SparkLayer (web component / SDK). For the demo
   the cart lives in the session; the checkout reads it and hands off to
   OrderProvider.createOrder (the stubbed order-create seam, §8).

   Lines may include a display snapshot (title/sku/amount) so checkout can show
   Shopify products that are not in the mock catalog fixtures.
   ======================================================================== */
export interface B2BCartLineMeta {
  title?: string;
  sku?: string;
  amount?: number;
  currency?: string;
  handle?: string;
  imageUrl?: string | null;
  /** Human-readable variant options, e.g. "Walnut / 140x200cm". */
  variantTitle?: string;
}

export interface B2BCartLine extends B2BCartLineMeta {
  productId: string;
  qty: number;
}

const KEY = 'b2bCart';

interface SessionLike {
  get: (key: string) => unknown;
  set: (key: string, value: unknown) => void;
  unset: (key: string) => void;
}

export function getCart(session: SessionLike): B2BCartLine[] {
  const raw = session.get(KEY);
  if (typeof raw !== 'string') return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as B2BCartLine[]) : [];
  } catch {
    return [];
  }
}

function save(session: SessionLike, lines: B2BCartLine[]) {
  session.set(KEY, JSON.stringify(lines));
}

export function addLine(
  session: SessionLike,
  productId: string,
  qty: number,
  meta?: B2BCartLineMeta,
) {
  const lines = getCart(session);
  const existing = lines.find((l) => l.productId === productId);
  if (existing) {
    existing.qty += qty;
    if (meta) Object.assign(existing, meta);
  } else {
    lines.push({productId, qty, ...meta});
  }
  save(session, lines);
}

export function setLine(
  session: SessionLike,
  productId: string,
  qty: number,
  meta?: B2BCartLineMeta,
) {
  const lines = getCart(session).filter((l) => l.productId !== productId);
  if (qty > 0) lines.push({...meta, productId, qty});
  save(session, lines);
}

export function removeLine(session: SessionLike, productId: string) {
  setLine(session, productId, 0);
}

export function clearCart(session: SessionLike) {
  session.unset(KEY);
}

/** Format selected option values for cart/checkout display. */
export function formatVariantTitle(
  selectedOptions?: Array<{name: string; value: string}> | null,
): string | undefined {
  if (!selectedOptions?.length) return undefined;
  const parts = selectedOptions
    .map((option) => option.value?.trim())
    .filter((value): value is string => Boolean(value) && value !== 'Default Title');
  return parts.length ? parts.join(' / ') : undefined;
}

export function cartCount(session: SessionLike): number {
  return getCart(session).length;
}

/** The 3 lines the checkout kit demonstrates — seeded on demo login. */
export function seedDemoCart(session: SessionLike) {
  save(session, [
    {
      productId: 'vlv-8830',
      qty: 12,
      title: 'Kuleventil DN25 rustfritt stål',
      sku: 'VLV-8830-SS',
      amount: 1248,
      variantTitle: 'VLV-8830-SS',
    },
    {
      productId: 'clp-022',
      qty: 100,
      title: 'Rørklemme 22 mm galvanisert',
      sku: 'CLP-022-ZN',
      amount: 39,
      variantTitle: 'CLP-022-ZN',
    },
    {
      productId: 'flg-2210',
      qty: 50,
      title: 'Flensepakning EPDM DN50',
      sku: 'FLG-2210-CS',
      amount: 64,
      variantTitle: 'FLG-2210-CS',
    },
  ]);
}
