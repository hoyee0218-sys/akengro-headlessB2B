/* DS ProductCard — ported. CSS in app/styles/components.css.
   Composes PriceDisplay + StockIndicator + Button. The `gated` prop is wired
   from the EntitlementProvider (BUILD.md §5 <B2BGate>): logged-out / non-entitled
   visitors see login-for-price copy and the add-to-cart is replaced by a login CTA. */
import type {ReactNode} from 'react';
import {PriceDisplay} from './PriceDisplay';
import {StockIndicator, type StockStatus} from './StockIndicator';
import {Button} from './Button';
import {t} from '~/lib/copy';

export function ProductCard({
  title,
  sku,
  image = null,
  amount,
  listAmount = null,
  currency = 'NOK',
  locale = 'nb-NO',
  vatMode = 'ex',
  gated = false,
  stockStatus = 'in',
  leadTime = null,
  onAddToCart,
  href = '#',
  cta,
  className = '',
  ...rest
}: {
  title: string;
  sku?: string;
  image?: string | null;
  amount?: number | null;
  listAmount?: number | null;
  currency?: string;
  locale?: string;
  vatMode?: 'ex' | 'inc';
  gated?: boolean;
  stockStatus?: StockStatus;
  leadTime?: string | null;
  onAddToCart?: (e: any) => void;
  href?: string;
  cta?: ReactNode;
  className?: string;
  [key: string]: any;
}) {
  const addLabel = cta ?? t('product.addToCart');
  return (
    <article className={['dsProduct', className].filter(Boolean).join(' ')} {...rest}>
      <a className="dsProduct__media" href={href} aria-label={title}>
        {image ? (
          <img src={image} alt={title} />
        ) : (
          <span className="dsProduct__ph">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect width="18" height="18" x="3" y="3" rx="2" />
              <circle cx="9" cy="9" r="2" />
              <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
            </svg>
          </span>
        )}
      </a>
      <div className="dsProduct__body">
        {sku && <span className="dsProduct__sku">{sku}</span>}
        <h3 className="dsProduct__title">
          <a href={href} style={{color: 'inherit', textDecoration: 'none'}}>
            {title}
          </a>
        </h3>
        <StockIndicator status={stockStatus} leadTime={leadTime} />
        <div className="dsProduct__spacer" />
        <div className="dsProduct__price">
          <PriceDisplay
            amount={amount}
            listAmount={listAmount}
            currency={currency}
            locale={locale}
            vatMode={vatMode}
            gated={gated}
            size="xs"
          />
        </div>
        <div className="dsProduct__foot">
          <Button
            variant={gated ? 'secondary' : 'primary'}
            size="sm"
            block
            disabled={stockStatus === 'out'}
            onClick={onAddToCart}
            as={gated ? 'a' : 'button'}
            href={gated ? '/account/login' : undefined}
          >
            {gated
              ? t('price.loginForPrice')
              : stockStatus === 'out'
                ? t('stock.out')
                : addLabel}
          </Button>
        </div>
      </div>
    </article>
  );
}
