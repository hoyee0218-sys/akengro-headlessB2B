/* B2B cart feedback: mini-cart drawer + short toast after add.
   Keeps buyers on the page (no redirect to checkout/cart). */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {Link, useFetcher, useRouteLoaderData} from 'react-router';
import type {B2BCartLine} from '~/lib/cart';
import type {CartAddResult, CartAddSuccess} from '~/lib/cart-add';
import type {RootLoader} from '~/root';
import {money} from '~/lib/format';
import {B2BCartLineRow} from '~/components/B2BCartLineRow';
import {Button} from '~/components/ds/Button';
import {Icon} from '~/components/ds/Icon';
import {t} from '~/lib/copy';

type CartUiValue = {
  open: boolean;
  openCart: () => void;
  closeCart: () => void;
  onAdded: (result: CartAddSuccess) => void;
};

const CartUiContext = createContext<CartUiValue | null>(null);

export function CartUiProvider({children}: {children: ReactNode}) {
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const openCart = useCallback(() => setOpen(true), []);
  const closeCart = useCallback(() => setOpen(false), []);

  const onAdded = useCallback((result: CartAddSuccess) => {
    setOpen(true);
    const message =
      result.addedCount === 1
        ? t('cart.addedToast')
        : t('cart.addedToastMany', {count: result.addedCount});
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3200);
  }, []);

  useEffect(
    () => () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    },
    [],
  );

  return (
    <CartUiContext.Provider value={{open, openCart, closeCart, onAdded}}>
      {children}
      <MiniCartDrawer open={open} onClose={closeCart} />
      {toast ? (
        <div className="sf-cart-toast" role="status" aria-live="polite">
          <Icon name="check" size={16} />
          <span>{toast}</span>
          <button
            type="button"
            className="sf-cart-toast__open"
            onClick={openCart}
          >
            {t('cart.viewCart')}
          </button>
        </div>
      ) : null}
    </CartUiContext.Provider>
  );
}

export function useCartUi() {
  const ctx = useContext(CartUiContext);
  if (!ctx) {
    throw new Error('useCartUi must be used within CartUiProvider');
  }
  return ctx;
}

/** Watch a fetcher that returns CartAddResult and open the mini-cart on success. */
export function useCartAddFeedback(
  fetcher: ReturnType<typeof useFetcher<CartAddResult>>,
) {
  const {onAdded} = useCartUi();
  const wasSubmitting = useRef(false);

  useEffect(() => {
    if (fetcher.state !== 'idle') {
      wasSubmitting.current = true;
      return;
    }
    if (!wasSubmitting.current) return;
    wasSubmitting.current = false;
    const data = fetcher.data;
    if (data?.ok) onAdded(data);
  }, [fetcher.state, fetcher.data, onAdded]);
}

type CartLineMeta = {
  title?: string;
  sku?: string;
  amount?: number;
  currency?: string;
  handle?: string;
  imageUrl?: string | null;
  variantTitle?: string;
};

/** Add a single product (listing cards / shared clients). */
export function useB2BCartAdd() {
  const fetcher = useFetcher<CartAddResult>();
  useCartAddFeedback(fetcher);

  const add = useCallback(
    (productId: string, qty = 1, meta?: CartLineMeta) => {
      const payload: Record<string, string> = {
        productId,
        qty: String(qty),
      };
      if (meta?.title) payload.title = meta.title;
      if (meta?.sku) payload.sku = meta.sku;
      if (meta?.handle) payload.handle = meta.handle;
      if (meta?.imageUrl) payload.imageUrl = meta.imageUrl;
      if (meta?.currency) payload.currency = meta.currency;
      if (meta?.variantTitle) payload.variantTitle = meta.variantTitle;
      if (meta?.amount != null && Number.isFinite(meta.amount)) {
        payload.amount = String(meta.amount);
      }
      fetcher.submit(payload, {method: 'post', action: '/cart/add'});
    },
    [fetcher],
  );

  return {
    add,
    busy: fetcher.state !== 'idle',
    fetcher,
  };
}

function MiniCartDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const root = useRouteLoaderData<RootLoader>('root');
  const lines: B2BCartLine[] = root?.cartLines ?? [];
  const headingId = useId();
  const subtotal = lines.reduce(
    (sum, line) => sum + (line.amount ?? 0) * line.qty,
    0,
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <div
      className={`sf-cart-drawer ${open ? 'is-open' : ''}`}
      aria-hidden={!open}
    >
      <button
        type="button"
        className="sf-cart-drawer__backdrop"
        aria-label={t('cart.close')}
        onClick={onClose}
        tabIndex={open ? 0 : -1}
      />
      <div
        className="sf-cart-drawer__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
      >
        <header className="sf-cart-drawer__head">
          <h2 id={headingId}>{t('cart.title')}</h2>
          <button
            type="button"
            className="sf-cart-drawer__close"
            onClick={onClose}
            aria-label={t('cart.close')}
          >
            <Icon name="x" size={18} />
          </button>
        </header>
        <div className="sf-cart-drawer__body">
          {lines.length === 0 ? (
            <p className="sf-cart-drawer__empty">{t('cart.empty')}</p>
          ) : (
            <ul className="sf-cart-drawer__lines">
              {lines.map((line) => (
                <li key={line.productId}>
                  <B2BCartLineRow
                    line={{
                      id: line.productId,
                      title: line.title || line.productId,
                      sku: line.sku || line.productId,
                      amount: line.amount ?? 0,
                      qty: line.qty,
                      imageUrl: line.imageUrl,
                      variantTitle: line.variantTitle,
                    }}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
        <footer className="sf-cart-drawer__foot">
          <p className="sf-cart-drawer__tax-note">{t('cart.taxNote')}</p>
          {lines.length > 0 ? (
            <Button
              as={Link}
              to="/checkout"
              block
              size="lg"
              onClick={onClose}
            >
              {t('cart.checkoutWithTotal', {total: money(subtotal, 2)})}
            </Button>
          ) : (
            <Button block size="lg" disabled>
              {t('cart.checkout')}
            </Button>
          )}
        </footer>
      </div>
    </div>
  );
}
