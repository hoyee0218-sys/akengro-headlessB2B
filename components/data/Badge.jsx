import React from 'react';

let injected = false;
function useBadgeStyles() {
  if (injected || typeof document === 'undefined') return;
  injected = true;
  const css = `
  .dsBadge {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 2px 8px; border-radius: var(--radius-pill);
    font: var(--weight-semibold) var(--scale-xs)/1.4 var(--font-body);
    white-space: nowrap; border: 1px solid transparent;
  }
  .dsBadge--neutral { background: var(--surface-inset); color: var(--text-secondary); }
  .dsBadge--success { background: var(--status-success-bg); color: var(--status-success-fg); }
  .dsBadge--warning { background: var(--status-warning-bg); color: var(--status-warning-fg); }
  .dsBadge--danger  { background: var(--status-danger-bg);  color: var(--status-danger-fg); }
  .dsBadge--info    { background: var(--status-info-bg);    color: var(--status-info-fg); }
  .dsBadge--outline { background: transparent; border-color: var(--border-strong); color: var(--text-secondary); }
  .dsBadge--solid   { background: var(--brand-primary); color: var(--brand-on-primary); }
  .dsBadge__dot { width: 7px; height: 7px; border-radius: 50%; background: currentColor; }
  `;
  const el = document.createElement('style');
  el.setAttribute('data-ds', 'badge');
  el.textContent = css;
  document.head.appendChild(el);
}

export function Badge({ tone = 'neutral', dot = false, className = '', children, ...rest }) {
  useBadgeStyles();
  return (
    <span className={['dsBadge', `dsBadge--${tone}`, className].filter(Boolean).join(' ')} {...rest}>
      {dot && <span className="dsBadge__dot" />}
      {children}
    </span>
  );
}
