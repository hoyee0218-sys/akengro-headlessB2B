import React from 'react';

let injected = false;
function usePriceStyles() {
  if (injected || typeof document === 'undefined') return;
  injected = true;
  const css = `
  .dsPrice { display: inline-flex; flex-direction: column; gap: 1px; font-family: var(--font-mono); }
  .dsPrice__row { display: inline-flex; align-items: baseline; flex-wrap: wrap; gap: var(--space-1) var(--space-2); }
  .dsPrice__amount { font-variant-numeric: tabular-nums; font-weight: var(--weight-semibold); color: var(--text-primary); letter-spacing: -0.01em; font-size: var(--scale-xs); }
  .dsPrice__list { font-variant-numeric: tabular-nums; color: var(--text-muted); text-decoration: line-through; font-size: var(--scale-2xs); }
  .dsPrice__vat { font-family: var(--font-body); font-size: var(--scale-2xs); color: var(--text-muted); letter-spacing: var(--tracking-wide); }
  .dsPrice--xs .dsPrice__amount { font-size: var(--scale-xs); }
  .dsPrice--sm .dsPrice__amount { font-size: var(--scale-sm); }
  .dsPrice--md .dsPrice__amount { font-size: var(--scale-md); }
  .dsPrice--lg .dsPrice__amount { font-size: var(--scale-lg); }
  .dsPrice__gated {
    display: inline-flex; align-items: center; gap: 6px;
    font-family: var(--font-body); font-size: var(--scale-xs); color: var(--text-muted);
  }
  .dsPrice__gated svg { width: 14px; height: 14px; }
  .dsPrice__save { font-family: var(--font-body); font-size: var(--scale-2xs); font-weight: var(--weight-semibold); color: var(--status-success-fg); }
  `;
  const el = document.createElement('style');
  el.setAttribute('data-ds', 'price');
  el.textContent = css;
  document.head.appendChild(el);
}

function format(amount, currency, locale) {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      currencyDisplay: 'narrowSymbol',
      minimumFractionDigits: 2,
    }).format(amount);
  } catch (e) {
    return amount.toFixed(2) + ' ' + currency;
  }
}

export function PriceDisplay({
  amount,
  listAmount = null,
  currency = 'NOK',
  locale = 'nb-NO',
  vatMode = 'ex',
  size = 'xs',
  gated = false,
  className = '',
  ...rest
}) {
  usePriceStyles();

  if (gated || amount == null) {
    return (
      <span className={['dsPrice__gated', className].filter(Boolean).join(' ')} {...rest}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        Logg inn for pris
      </span>
    );
  }

  const vatLabel = vatMode === 'inc' ? 'inkl. mva' : 'eks. mva';
  const hasList = listAmount != null && listAmount > amount;
  const pct = hasList ? Math.round((1 - amount / listAmount) * 100) : 0;

  return (
    <span className={['dsPrice', `dsPrice--${size}`, className].filter(Boolean).join(' ')} {...rest}>
      <span className="dsPrice__row">
        <span className="dsPrice__amount">{format(amount, currency, locale)}</span>
        {hasList && <span className="dsPrice__list">{format(listAmount, currency, locale)}</span>}
      </span>
      <span className="dsPrice__row">
        <span className="dsPrice__vat">{vatLabel}</span>
        {hasList && <span className="dsPrice__save">−{pct}% din pris</span>}
      </span>
    </span>
  );
}
