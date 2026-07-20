import React from 'react';

let injected = false;
function useIconButtonStyles() {
  if (injected || typeof document === 'undefined') return;
  injected = true;
  const css = `
  .dsIconBtn {
    --_bg: transparent; --_bg-hover: var(--surface-sunken);
    --_fg: var(--text-secondary); --_bd: transparent;
    display: inline-flex; align-items: center; justify-content: center;
    border: 1px solid var(--_bd); border-radius: var(--radius-control);
    background: var(--_bg); color: var(--_fg); cursor: pointer;
    transition: var(--transition-control);
  }
  .dsIconBtn:hover:not(:disabled) { background: var(--_bg-hover); color: var(--text-primary); }
  .dsIconBtn:focus-visible { outline: none; box-shadow: var(--ring); }
  .dsIconBtn:disabled { opacity: 0.4; cursor: not-allowed; }
  .dsIconBtn--sm { width: 32px; height: 32px; }
  .dsIconBtn--md { width: 40px; height: 40px; }
  .dsIconBtn--lg { width: 48px; height: 48px; }
  .dsIconBtn--outlined { --_bd: var(--border-strong); --_bg: var(--surface-base); }
  .dsIconBtn--solid { --_bg: var(--brand-primary); --_bg-hover: var(--brand-primary-hover); --_fg: var(--brand-on-primary); }
  .dsIconBtn__badge {
    position: absolute; top: -4px; right: -4px; min-width: 16px; height: 16px;
    padding: 0 4px; border-radius: var(--radius-pill);
    background: var(--brand-accent); color: var(--text-on-accent);
    font: var(--weight-bold) 10px/16px var(--font-mono); text-align: center;
  }
  .dsIconBtn__wrap { position: relative; display: inline-flex; }
  `;
  const el = document.createElement('style');
  el.setAttribute('data-ds', 'icon-button');
  el.textContent = css;
  document.head.appendChild(el);
}

export function IconButton({
  variant = 'ghost',
  size = 'md',
  label,
  badge = null,
  className = '',
  children,
  ...rest
}) {
  useIconButtonStyles();
  const cls = [
    'dsIconBtn',
    `dsIconBtn--${size}`,
    variant !== 'ghost' ? `dsIconBtn--${variant}` : '',
    className,
  ].filter(Boolean).join(' ');

  const btn = (
    <button className={cls} aria-label={label} title={label} {...rest}>
      {children}
    </button>
  );

  if (badge == null) return btn;
  return (
    <span className="dsIconBtn__wrap">
      {btn}
      <span className="dsIconBtn__badge">{badge}</span>
    </span>
  );
}
