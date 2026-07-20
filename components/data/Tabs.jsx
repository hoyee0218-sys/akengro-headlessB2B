import React from 'react';

let injected = false;
function useTabsStyles() {
  if (injected || typeof document === 'undefined') return;
  injected = true;
  const css = `
  .dsTabs { display: flex; gap: var(--space-1); border-bottom: 1px solid var(--border-subtle); }
  .dsTabs__tab {
    position: relative; appearance: none; border: none; background: transparent;
    padding: var(--space-3) var(--space-3); margin-bottom: -1px;
    font: var(--weight-medium) var(--scale-sm)/1 var(--font-body);
    color: var(--text-secondary); cursor: pointer;
    border-bottom: 2px solid transparent; transition: var(--transition-control);
    display: inline-flex; align-items: center; gap: 6px;
  }
  .dsTabs__tab:hover { color: var(--text-primary); }
  .dsTabs__tab[aria-selected="true"] { color: var(--text-primary); border-bottom-color: var(--brand-primary); font-weight: var(--weight-semibold); }
  .dsTabs__tab:focus-visible { outline: none; box-shadow: var(--ring); border-radius: var(--radius-xs); }
  .dsTabs__count {
    font-family: var(--font-mono); font-size: var(--scale-2xs);
    background: var(--surface-inset); color: var(--text-muted);
    padding: 1px 6px; border-radius: var(--radius-pill);
  }
  `;
  const el = document.createElement('style');
  el.setAttribute('data-ds', 'tabs');
  el.textContent = css;
  document.head.appendChild(el);
}

export function Tabs({ tabs = [], value, onChange, className = '' }) {
  useTabsStyles();
  return (
    <div className={['dsTabs', className].filter(Boolean).join(' ')} role="tablist">
      {tabs.map((t) => {
        const tab = typeof t === 'string' ? { value: t, label: t } : t;
        const selected = tab.value === value;
        return (
          <button
            key={tab.value}
            role="tab"
            aria-selected={selected}
            className="dsTabs__tab"
            onClick={() => onChange && onChange(tab.value)}
          >
            {tab.label}
            {tab.count != null && <span className="dsTabs__count">{tab.count}</span>}
          </button>
        );
      })}
    </div>
  );
}
