/* Quick-add modal — Shopify-style variant + qty picker for PLP/home cards. */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {Link, useFetcher} from 'react-router';
import {Button} from '~/components/ds/Button';
import {Icon} from '~/components/ds/Icon';
import {PriceDisplay} from '~/components/ds/PriceDisplay';
import {QuantityStepper} from '~/components/ds/QuantityStepper';
import {StockIndicator} from '~/components/ds/StockIndicator';
import {useB2BCartAdd} from '~/components/CartUi';
import {
  findQuickAddVariant,
  isQuickAddOptionAvailable,
  quickAddCartId,
  type QuickAddProduct,
} from '~/lib/quick-add';
import {formatVariantTitle} from '~/lib/cart';
import {t} from '~/lib/copy';

type QuickAddApiData = {
  product: QuickAddProduct;
  loggedIn: boolean;
};

type QuickAddContextValue = {
  openQuickAdd: (handle: string) => void;
  closeQuickAdd: () => void;
};

const QuickAddContext = createContext<QuickAddContextValue | null>(null);

export function QuickAddProvider({children}: {children: ReactNode}) {
  const [handle, setHandle] = useState<string | null>(null);
  // Keep the add fetcher mounted so mini-cart feedback survives modal close.
  const {add, busy} = useB2BCartAdd();

  const openQuickAdd = useCallback((nextHandle: string) => {
    setHandle(nextHandle);
  }, []);
  const closeQuickAdd = useCallback(() => setHandle(null), []);

  return (
    <QuickAddContext.Provider value={{openQuickAdd, closeQuickAdd}}>
      {children}
      {handle ? (
        <QuickAddModal
          handle={handle}
          onClose={closeQuickAdd}
          onAdd={(productId, qty, meta) => {
            add(productId, qty, meta);
            closeQuickAdd();
          }}
          busy={busy}
        />
      ) : null}
    </QuickAddContext.Provider>
  );
}

export function useQuickAdd() {
  const ctx = useContext(QuickAddContext);
  if (!ctx) {
    throw new Error('useQuickAdd must be used within QuickAddProvider');
  }
  return ctx;
}

function QuickAddModal({
  handle,
  onClose,
  onAdd,
  busy,
}: {
  handle: string;
  onClose: () => void;
  onAdd: (
    productId: string,
    qty: number,
    meta?: {
      title?: string;
      sku?: string;
      amount?: number;
      currency?: string;
      handle?: string;
      imageUrl?: string | null;
      variantTitle?: string;
    },
  ) => void;
  busy: boolean;
}) {
  const loadFetcher = useFetcher<QuickAddApiData>();
  const titleId = useId();
  const [qty, setQty] = useState(1);
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [initializedFor, setInitializedFor] = useState<string | null>(null);

  useEffect(() => {
    loadFetcher.load(`/api/quick-add/${encodeURIComponent(handle)}`);
  }, [handle]);

  const product =
    loadFetcher.data?.product?.handle === handle
      ? loadFetcher.data.product
      : null;
  const loggedIn =
    loadFetcher.data?.product?.handle === handle
      ? Boolean(loadFetcher.data.loggedIn)
      : false;
  const loading = !product;

  useEffect(() => {
    if (!product || initializedFor === product.handle) return;
    const defaultVariant =
      product.variants.find((variant) => variant.id === product.defaultVariantId) ??
      product.variants[0];
    if (defaultVariant) {
      setSelected(
        Object.fromEntries(
          defaultVariant.selectedOptions.map((option) => [
            option.name,
            option.value,
          ]),
        ),
      );
    } else {
      setSelected({});
    }
    setQty(1);
    setInitializedFor(product.handle);
  }, [product, initializedFor]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const selectedVariant = useMemo(
    () => (product ? findQuickAddVariant(product.variants, selected) : null),
    [product, selected],
  );

  const showOptions =
    product != null &&
    product.options.some((option) => option.values.length > 1);

  const imageUrl = selectedVariant?.imageUrl || product?.imageUrl || null;
  const stock = selectedVariant?.stock ?? 'out';
  const price = selectedVariant?.price;
  const canAdd =
    loggedIn &&
    selectedVariant != null &&
    selectedVariant.availableForSale &&
    stock !== 'out' &&
    !busy;

  const selectOption = (name: string, value: string) => {
    setSelected((prev) => ({...prev, [name]: value}));
  };

  const submitAdd = () => {
    if (!product || !selectedVariant || !canAdd) return;
    onAdd(quickAddCartId(product, selectedVariant), qty, {
      title: product.title,
      sku: selectedVariant.sku,
      amount: selectedVariant.price.amount ?? undefined,
      currency: selectedVariant.price.currency,
      handle: product.handle,
      imageUrl: selectedVariant.imageUrl || product.imageUrl,
      variantTitle: formatVariantTitle(selectedVariant.selectedOptions),
    });
  };

  return (
    <div className="sf-quick-add is-open" role="presentation">
      <button
        type="button"
        className="sf-quick-add__backdrop"
        aria-label={t('quickAdd.close')}
        onClick={onClose}
      />
      <div
        className="sf-quick-add__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <header className="sf-quick-add__head">
          <h2 id={titleId}>{t('quickAdd.title')}</h2>
          <button
            type="button"
            className="sf-quick-add__close"
            onClick={onClose}
            aria-label={t('quickAdd.close')}
          >
            <Icon name="x" size={18} />
          </button>
        </header>

        <div className="sf-quick-add__body">
          {loading || !product ? (
            <p className="sf-quick-add__loading">{t('quickAdd.loading')}</p>
          ) : (
            <div className="sf-quick-add__grid">
              <div className="sf-quick-add__media">
                {imageUrl ? (
                  <img src={imageUrl} alt={product.title} />
                ) : (
                  <span className="sf-quick-add__ph">
                    <Icon name="image" size={36} />
                  </span>
                )}
              </div>

              <div className="sf-quick-add__info">
                <h3 className="sf-quick-add__product-title">{product.title}</h3>
                {selectedVariant?.sku ? (
                  <div className="sf-quick-add__sku">
                    {t('pdp.sku', {sku: selectedVariant.sku})}
                  </div>
                ) : null}
                <StockIndicator status={stock} />

                {showOptions ? (
                  <div className="sf-quick-add__options">
                    {product.options.map((option) => (
                      <fieldset key={option.name} className="sf-pdp__option-set">
                        <legend>{option.name}</legend>
                        <div className="sf-pdp__option-values">
                          {option.values.map((value) => {
                            const available = isQuickAddOptionAvailable(
                              product.variants,
                              option.name,
                              value.name,
                              selected,
                            );
                            const active = selected[option.name] === value.name;
                            const inStock = product.variants.some(
                              (variant) =>
                                variant.availableForSale &&
                                variant.selectedOptions.some(
                                  (selectedOption) =>
                                    selectedOption.name === option.name &&
                                    selectedOption.value === value.name,
                                ) &&
                                variant.selectedOptions.every((selectedOption) => {
                                  if (selectedOption.name === option.name) {
                                    return true;
                                  }
                                  const current = selected[selectedOption.name];
                                  return (
                                    !current || current === selectedOption.value
                                  );
                                }),
                            );
                            return (
                              <button
                                key={`${option.name}-${value.name}`}
                                type="button"
                                disabled={!available}
                                aria-pressed={active}
                                className={[
                                  'sf-pdp__option',
                                  active ? 'sf-pdp__option--active' : '',
                                  available && !inStock
                                    ? 'sf-pdp__option--unavailable'
                                    : '',
                                  !available ? 'sf-pdp__option--missing' : '',
                                ]
                                  .filter(Boolean)
                                  .join(' ')}
                                onClick={() =>
                                  selectOption(option.name, value.name)
                                }
                              >
                                {value.name}
                              </button>
                            );
                          })}
                        </div>
                      </fieldset>
                    ))}
                  </div>
                ) : null}

                <div className="sf-quick-add__price">
                  {loggedIn && price && !price.gated && price.amount != null ? (
                    <PriceDisplay
                      amount={price.amount}
                      listAmount={price.listAmount}
                      currency={price.currency}
                      vatMode="ex"
                      size="md"
                    />
                  ) : (
                    <PriceDisplay gated />
                  )}
                </div>

                <div className="sf-quick-add__buy">
                  <QuantityStepper
                    value={qty}
                    min={1}
                    step={1}
                    unit={t('qty.unit')}
                    onChange={setQty}
                  />
                  <Button
                    type="button"
                    size="lg"
                    disabled={!canAdd}
                    loading={busy}
                    onClick={submitAdd}
                    iconStart={<Icon name="shopping-cart" size={16} />}
                  >
                    {stock === 'out'
                      ? t('stock.out')
                      : t('product.addToCartLong')}
                  </Button>
                </div>

                {!loggedIn ? (
                  <p className="sf-quick-add__gate">
                    {t('pdp.gateHint')}{' '}
                    <Link to="/account/login">{t('nav.login')}</Link>
                  </p>
                ) : null}

                <Link
                  to={`/products/${product.handle}`}
                  className="sf-quick-add__details"
                  onClick={onClose}
                >
                  {t('quickAdd.viewDetails')}
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
