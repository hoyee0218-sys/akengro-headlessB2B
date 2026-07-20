/* Shared cart line row — image, price, variant, qty stepper, remove.
   Used by the mini-cart drawer and the checkout review list. */
import {useFetcher} from 'react-router';
import {Icon} from '~/components/ds/Icon';
import {QuantityStepper} from '~/components/ds/QuantityStepper';
import {money} from '~/lib/format';
import {t} from '~/lib/copy';

export type CartLineDisplay = {
  id: string;
  title: string;
  sku: string;
  amount: number;
  qty: number;
  imageUrl?: string | null;
  variantTitle?: string;
};

export function B2BCartLineRow({
  line,
  layout = 'drawer',
}: {
  line: CartLineDisplay;
  layout?: 'drawer' | 'checkout';
}) {
  const fetcher = useFetcher();
  const busy = fetcher.state !== 'idle';
  const unitPrice = line.amount;
  const lineTotal = unitPrice * line.qty;

  const setQty = (qty: number) => {
    fetcher.submit(
      {intent: 'set', productId: line.id, qty: String(qty)},
      {method: 'post', action: '/cart/update'},
    );
  };

  const remove = () => {
    fetcher.submit(
      {intent: 'remove', productId: line.id},
      {method: 'post', action: '/cart/update'},
    );
  };

  return (
    <article
      className={[
        'sf-cart-line',
        layout === 'checkout' ? 'sf-cart-line--checkout' : '',
        busy ? 'is-busy' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="sf-cart-line__media" aria-hidden={!line.imageUrl}>
        {line.imageUrl ? (
          <img src={line.imageUrl} alt="" />
        ) : (
          <span className="sf-cart-line__ph">
            <Icon name="image" size={22} />
          </span>
        )}
      </div>

      <div className="sf-cart-line__info">
        <h3 className="sf-cart-line__title">{line.title}</h3>
        <div className="sf-cart-line__price">{money(unitPrice, 2)}</div>
        {line.variantTitle ? (
          <div className="sf-cart-line__variant">{line.variantTitle}</div>
        ) : line.sku ? (
          <div className="sf-cart-line__variant">{line.sku}</div>
        ) : null}

        <div className="sf-cart-line__actions">
          <QuantityStepper
            value={line.qty}
            min={1}
            step={1}
            size="sm"
            onChange={setQty}
          />
          <button
            type="button"
            className="sf-cart-line__remove"
            onClick={remove}
            disabled={busy}
          >
            {t('cart.remove')}
          </button>
        </div>
      </div>

      {layout === 'checkout' ? (
        <div className="sf-cart-line__total">{money(lineTotal, 2)}</div>
      ) : null}
    </article>
  );
}
