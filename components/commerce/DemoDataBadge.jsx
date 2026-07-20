import React from 'react';

let injected = false;
function useDemoStyles() {
  if (injected || typeof document === 'undefined') return;
  injected = true;
  const css = `
  .dsDemo {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 2px 7px; border-radius: var(--radius-xs);
    background: var(--demo-bg); color: var(--demo-fg);
    border: 1px dashed var(--demo-border);
    font: var(--weight-bold) var(--scale-2xs)/1.4 var(--font-mono);
    letter-spacing: var(--tracking-wide); text-transform: uppercase; white-space: nowrap;
  }
  .dsDemo svg { width: 11px; height: 11px; }
  .dsDemo--corner { position: absolute; top: var(--space-3); right: var(--space-3); z-index: 2; }
  `;
  const el = document.createElement('style');
  el.setAttribute('data-ds', 'demo');
  el.textContent = css;
  document.head.appendChild(el);
}

export function DemoDataBadge({ corner = false, label = 'Demo data', className = '', ...rest }) {
  useDemoStyles();
  return (
    <span className={['dsDemo', corner ? 'dsDemo--corner' : '', className].filter(Boolean).join(' ')} title="Mock-data fra integrasjonssøm (§7)" {...rest}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 9v4M12 17h.01"/><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/></svg>
      {label}
    </span>
  );
}
