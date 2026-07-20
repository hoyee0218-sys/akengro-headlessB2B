import React from 'react';

/* Inject component CSS once into the document head. */
let injected = false;
function useButtonStyles() {
  if (injected || typeof document === 'undefined') return;
  injected = true;
  const css = `
  .dsBtn {
    --_bg: var(--brand-primary);
    --_bg-hover: var(--brand-primary-hover);
    --_fg: var(--brand-on-primary);
    --_bd: transparent;
    display: inline-flex; align-items: center; justify-content: center;
    gap: var(--space-2);
    font-family: var(--font-body); font-weight: var(--weight-semibold);
    line-height: 1; white-space: nowrap; text-decoration: none;
    border: 1px solid var(--_bd); border-radius: var(--radius-control);
    background: var(--_bg); color: var(--_fg);
    cursor: pointer; user-select: none;
    transition: var(--transition-control), transform var(--motion-fast) var(--ease-standard);
  }
  .dsBtn:hover:not(:disabled) { background: var(--_bg-hover); }
  .dsBtn:active:not(:disabled) { transform: translateY(0.5px); }
  .dsBtn:focus-visible { outline: none; box-shadow: var(--ring); }
  .dsBtn:disabled { opacity: 0.45; cursor: not-allowed; }

  .dsBtn--sm { height: 32px; padding: 0 var(--space-3); font-size: var(--scale-sm); }
  .dsBtn--md { height: 40px; padding: 0 var(--space-4); font-size: var(--scale-base); }
  .dsBtn--lg { height: 48px; padding: 0 var(--space-6); font-size: var(--scale-md); }

  .dsBtn--secondary {
    --_bg: var(--surface-base); --_bg-hover: var(--surface-sunken);
    --_fg: var(--text-primary); --_bd: var(--border-strong);
  }
  .dsBtn--ghost {
    --_bg: transparent; --_bg-hover: var(--surface-sunken);
    --_fg: var(--text-primary); --_bd: transparent;
  }
  .dsBtn--accent {
    --_bg: var(--brand-accent); --_fg: var(--text-on-accent);
    --_bg-hover: color-mix(in srgb, var(--brand-accent) 86%, black);
  }
  .dsBtn--danger {
    --_bg: var(--status-danger); --_fg: #fff;
    --_bg-hover: color-mix(in srgb, var(--status-danger) 86%, black);
  }
  .dsBtn--block { display: flex; width: 100%; }
  .dsBtn__spin {
    width: 1em; height: 1em; border-radius: 50%;
    border: 2px solid currentColor; border-right-color: transparent;
    animation: dsBtnSpin 0.6s linear infinite;
  }
  @keyframes dsBtnSpin { to { transform: rotate(360deg); } }
  @media (prefers-reduced-motion: reduce) { .dsBtn__spin { animation-duration: 1.4s; } }
  `;
  const el = document.createElement('style');
  el.setAttribute('data-ds', 'button');
  el.textContent = css;
  document.head.appendChild(el);
}

export function Button({
  variant = 'primary',
  size = 'md',
  block = false,
  loading = false,
  disabled = false,
  iconStart = null,
  iconEnd = null,
  as = 'button',
  className = '',
  children,
  ...rest
}) {
  useButtonStyles();
  const Tag = as;
  const cls = [
    'dsBtn',
    `dsBtn--${size}`,
    variant !== 'primary' ? `dsBtn--${variant}` : '',
    block ? 'dsBtn--block' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <Tag className={cls} disabled={Tag === 'button' ? (disabled || loading) : undefined} aria-busy={loading || undefined} {...rest}>
      {loading && <span className="dsBtn__spin" aria-hidden="true" />}
      {!loading && iconStart}
      {children}
      {!loading && iconEnd}
    </Tag>
  );
}
