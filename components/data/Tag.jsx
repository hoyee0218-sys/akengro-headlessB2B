import React from 'react';

let injected = false;
function useTagStyles() {
  if (injected || typeof document === 'undefined') return;
  injected = true;
  const css = `
  .dsTag {
    display: inline-flex; align-items: center; gap: 6px;
    height: 28px; padding: 0 var(--space-2) 0 var(--space-3);
    border: 1px solid var(--border-strong); border-radius: var(--radius-sm);
    background: var(--surface-base); color: var(--text-primary);
    font: var(--weight-medium) var(--scale-sm)/1 var(--font-body); white-space: nowrap;
  }
  .dsTag--selected { background: var(--brand-primary); border-color: var(--brand-primary); color: var(--brand-on-primary); }
  .dsTag--button { cursor: pointer; transition: var(--transition-control); }
  .dsTag--button:hover { background: var(--surface-sunken); }
  .dsTag--selected.dsTag--button:hover { background: var(--brand-primary-hover); }
  .dsTag__remove {
    display: inline-flex; align-items: center; justify-content: center;
    width: 18px; height: 18px; margin-right: -2px; border: none; background: transparent;
    color: inherit; opacity: 0.6; cursor: pointer; border-radius: var(--radius-xs);
  }
  .dsTag__remove:hover { opacity: 1; background: rgba(0,0,0,0.08); }
  .dsTag__remove svg { width: 13px; height: 13px; }
  `;
  const el = document.createElement('style');
  el.setAttribute('data-ds', 'tag');
  el.textContent = css;
  document.head.appendChild(el);
}

export function Tag({ selected = false, onRemove, onClick, className = '', children, ...rest }) {
  useTagStyles();
  const interactive = Boolean(onClick);
  const cls = ['dsTag', selected ? 'dsTag--selected' : '', interactive ? 'dsTag--button' : '', className].filter(Boolean).join(' ');
  return (
    <span className={cls} onClick={onClick} role={interactive ? 'button' : undefined} {...rest}>
      {children}
      {onRemove && (
        <button className="dsTag__remove" aria-label="Fjern" onClick={(e) => { e.stopPropagation(); onRemove(e); }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
        </button>
      )}
    </span>
  );
}
