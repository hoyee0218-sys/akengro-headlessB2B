import React from 'react';

let injected = false;
function useStockStyles() {
  if (injected || typeof document === 'undefined') return;
  injected = true;
  const css = `
  .dsStock { display: inline-flex; align-items: center; gap: 7px; font: var(--weight-medium) var(--scale-sm)/1.3 var(--font-body); white-space: nowrap; }
  .dsStock__dot { width: 8px; height: 8px; border-radius: 50%; flex: none; }
  .dsStock--in    { color: var(--status-success-fg); } .dsStock--in    .dsStock__dot { background: var(--status-success); }
  .dsStock--low   { color: var(--status-warning-fg); } .dsStock--low   .dsStock__dot { background: var(--status-warning); }
  .dsStock--out   { color: var(--status-danger-fg);  } .dsStock--out   .dsStock__dot { background: var(--status-danger); }
  .dsStock--backorder { color: var(--status-info-fg); } .dsStock--backorder .dsStock__dot { background: var(--status-info); }
  .dsStock__lead { color: var(--text-muted); font-weight: var(--weight-regular); }
  `;
  const el = document.createElement('style');
  el.setAttribute('data-ds', 'stock');
  el.textContent = css;
  document.head.appendChild(el);
}

const LABELS = {
  in: 'På lager',
  low: 'Få igjen',
  out: 'Utsolgt',
  backorder: 'Restordre',
};

export function StockIndicator({
  status = 'in',
  qty = null,
  leadTime = null,
  label,
  className = '',
  ...rest
}) {
  useStockStyles();
  let text = label || LABELS[status] || status;
  if (status === 'low' && qty != null) text = `Få igjen (${qty})`;
  return (
    <span className={['dsStock', `dsStock--${status}`, className].filter(Boolean).join(' ')} {...rest}>
      <span className="dsStock__dot" />
      <span>{text}</span>
      {leadTime && <span className="dsStock__lead">· {leadTime}</span>}
    </span>
  );
}
