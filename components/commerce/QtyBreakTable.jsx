import React from 'react';

let injected = false;
function useBreakStyles() {
  if (injected || typeof document === 'undefined') return;
  injected = true;
  const css = `
  .dsBreak { width: 100%; border-collapse: collapse; font-family: var(--font-mono); }
  .dsBreak th { font: var(--text-label); font-family: var(--font-body); text-transform: uppercase; letter-spacing: var(--tracking-caps); color: var(--text-muted); text-align: left; padding: 0 var(--space-3) var(--space-2); }
  .dsBreak th:last-child, .dsBreak td:last-child { text-align: right; }
  .dsBreak td { padding: 8px var(--space-3); font-size: var(--scale-sm); color: var(--text-primary); border-top: 1px solid var(--border-subtle); font-variant-numeric: tabular-nums; }
  .dsBreak tr[data-active="true"] td { background: var(--status-success-bg); color: var(--status-success-fg); font-weight: var(--weight-semibold); }
  .dsBreak__save { color: var(--status-success-fg); font-family: var(--font-body); font-size: var(--scale-2xs); font-weight: var(--weight-semibold); margin-left: 6px; }
  `;
  const el = document.createElement('style');
  el.setAttribute('data-ds', 'break');
  el.textContent = css;
  document.head.appendChild(el);
}

function fmt(amount, currency, locale) {
  try { return new Intl.NumberFormat(locale, { style: 'currency', currency, minimumFractionDigits: 2 }).format(amount); }
  catch (e) { return amount.toFixed(2) + ' ' + currency; }
}

export function QtyBreakTable({
  breaks = [],
  currency = 'NOK',
  locale = 'nb-NO',
  currentQty = null,
  unit = 'stk',
  className = '',
}) {
  useBreakStyles();
  const sorted = [...breaks].sort((a, b) => a.minQty - b.minQty);
  const base = sorted.length ? sorted[0].price : 0;
  let activeIdx = -1;
  if (currentQty != null) {
    sorted.forEach((b, i) => { if (currentQty >= b.minQty) activeIdx = i; });
  }

  return (
    <table className={['dsBreak', className].filter(Boolean).join(' ')}>
      <thead>
        <tr><th>Antall</th><th>Pris pr. {unit}</th></tr>
      </thead>
      <tbody>
        {sorted.map((b, i) => {
          const pct = base > 0 ? Math.round((1 - b.price / base) * 100) : 0;
          return (
            <tr key={b.minQty} data-active={i === activeIdx}>
              <td>{b.minQty}+ {unit}</td>
              <td>
                {fmt(b.price, currency, locale)}
                {pct > 0 && <span className="dsBreak__save">−{pct}%</span>}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
