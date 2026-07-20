import React from 'react';

let injected = false;
function useCardStyles() {
  if (injected || typeof document === 'undefined') return;
  injected = true;
  const css = `
  .dsCard {
    display: flex; flex-direction: column;
    background: var(--surface-raised);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-card);
    overflow: clip;
  }
  .dsCard--flat { box-shadow: none; }
  .dsCard--raised { box-shadow: var(--shadow-sm); }
  .dsCard--interactive { cursor: pointer; transition: box-shadow var(--motion-base) var(--ease-standard), border-color var(--motion-base) var(--ease-standard); }
  .dsCard--interactive:hover { box-shadow: var(--shadow-md); border-color: var(--border-strong); }
  .dsCard--interactive:focus-visible { outline: none; box-shadow: var(--ring); }
  .dsCard__pad { padding: var(--space-5); display: flex; flex-direction: column; gap: var(--space-2); }
  .dsCard__header { padding: var(--space-4) var(--space-5); border-bottom: 1px solid var(--border-subtle); display: flex; align-items: center; justify-content: space-between; gap: var(--space-3); }
  .dsCard__title { font: var(--weight-semibold) var(--scale-md)/1.3 var(--font-display); color: var(--text-primary); letter-spacing: var(--tracking-tight); }
  .dsCard__footer { padding: var(--space-4) var(--space-5); border-top: 1px solid var(--border-subtle); display: flex; align-items: center; gap: var(--space-3); }
  `;
  const el = document.createElement('style');
  el.setAttribute('data-ds', 'card');
  el.textContent = css;
  document.head.appendChild(el);
}

export function Card({
  elevation = 'flat',
  interactive = false,
  title,
  headerAction,
  footer,
  padded = true,
  className = '',
  children,
  ...rest
}) {
  useCardStyles();
  const cls = [
    'dsCard',
    `dsCard--${elevation}`,
    interactive ? 'dsCard--interactive' : '',
    className,
  ].filter(Boolean).join(' ');
  return (
    <div className={cls} tabIndex={interactive ? 0 : undefined} {...rest}>
      {title && (
        <div className="dsCard__header">
          <span className="dsCard__title">{title}</span>
          {headerAction}
        </div>
      )}
      {padded ? <div className="dsCard__pad">{children}</div> : children}
      {footer && <div className="dsCard__footer">{footer}</div>}
    </div>
  );
}
