import React from 'react';
import { PriceDisplay } from './PriceDisplay.jsx';
import { StockIndicator } from './StockIndicator.jsx';
import { Button } from '../buttons/Button.jsx';

let injected = false;
function useProductCardStyles() {
  if (injected || typeof document === 'undefined') return;
  injected = true;
  const css = `
  .dsProduct {
    position: relative; display: flex; flex-direction: column;
    background: var(--surface-raised); border: 1px solid var(--border-subtle);
    border-radius: var(--radius-card); overflow: clip;
    transition: box-shadow var(--motion-base) var(--ease-standard), border-color var(--motion-base) var(--ease-standard);
  }
  .dsProduct:hover { box-shadow: var(--shadow-md); border-color: var(--border-strong); }
  .dsProduct__media {
    aspect-ratio: 4 / 3; background: var(--surface-sunken);
    display: flex; align-items: center; justify-content: center; overflow: clip;
  }
  .dsProduct__media img { width: 100%; height: 100%; object-fit: cover; }
  .dsProduct__ph { color: var(--gray-300); }
  .dsProduct__ph svg { width: 40px; height: 40px; }
  .dsProduct__body { display: flex; flex-direction: column; gap: var(--space-2); padding: var(--space-3); flex: 1; }
  .dsProduct__sku { font: var(--scale-2xs)/1 var(--font-mono); color: var(--text-muted); letter-spacing: 0.02em; }
  .dsProduct__title { font: var(--weight-semibold) var(--scale-base)/1.3 var(--font-body); color: var(--text-primary); margin: 0; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
  .dsProduct__spacer { flex: 1; }
  .dsProduct__price { margin-top: var(--space-1); }
  .dsProduct__foot { display: flex; align-items: center; justify-content: space-between; gap: var(--space-2); margin-top: var(--space-3); }
  `;
  const el = document.createElement('style');
  el.setAttribute('data-ds', 'product-card');
  el.textContent = css;
  document.head.appendChild(el);
}

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
  cta = 'Legg i kurv',
  className = '',
  ...rest
}) {
  useProductCardStyles();
  return (
    <article className={['dsProduct', className].filter(Boolean).join(' ')} {...rest}>
      <a className="dsProduct__media" href={href} aria-label={title}>
        {image
          ? <img src={image} alt={title} />
          : <span className="dsProduct__ph"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg></span>}
      </a>
      <div className="dsProduct__body">
        {sku && <span className="dsProduct__sku">{sku}</span>}
        <h3 className="dsProduct__title"><a href={href} style={{ color: 'inherit', textDecoration: 'none' }}>{title}</a></h3>
        <StockIndicator status={stockStatus} leadTime={leadTime} />
        <div className="dsProduct__spacer" />
        <div className="dsProduct__price">
          <PriceDisplay amount={amount} listAmount={listAmount} currency={currency} locale={locale} vatMode={vatMode} gated={gated} size="xs" />
        </div>
        <div className="dsProduct__foot">
          <Button
            variant={gated ? 'secondary' : 'primary'}
            size="sm"
            block
            disabled={stockStatus === 'out'}
            onClick={onAddToCart}
            as={gated ? 'a' : 'button'}
            href={gated ? '/konto/logg-inn' : undefined}
          >
            {gated ? 'Logg inn for pris' : stockStatus === 'out' ? 'Utsolgt' : cta}
          </Button>
        </div>
      </div>
    </article>
  );
}
