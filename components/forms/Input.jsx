import React from 'react';

let injected = false;
function useInputStyles() {
  if (injected || typeof document === 'undefined') return;
  injected = true;
  const css = `
  .dsField { display: flex; flex-direction: column; gap: var(--space-2); font-family: var(--font-body); }
  .dsField__label { font: var(--text-label); color: var(--text-primary); display: flex; gap: 4px; align-items: baseline; }
  .dsField__req { color: var(--status-danger); }
  .dsField__hint { font-size: var(--scale-xs); color: var(--text-muted); }
  .dsField__error { font-size: var(--scale-xs); color: var(--status-danger-fg); }
  .dsInput {
    display: flex; align-items: center; gap: var(--space-2);
    height: 40px; padding: 0 var(--space-3);
    background: var(--surface-base);
    border: 1px solid var(--border-strong); border-radius: var(--radius-control);
    transition: var(--transition-control);
  }
  .dsInput:focus-within { border-color: var(--brand-accent); box-shadow: var(--ring); }
  .dsInput[data-invalid="true"] { border-color: var(--status-danger); }
  .dsInput[data-disabled="true"] { background: var(--surface-sunken); opacity: 0.7; }
  .dsInput--sm { height: 32px; }
  .dsInput--lg { height: 48px; }
  .dsInput__el {
    flex: 1; min-width: 0; border: none; outline: none; background: transparent;
    font: var(--text-body); color: var(--text-primary);
  }
  .dsInput__el::placeholder { color: var(--text-muted); }
  .dsInput__affix { color: var(--text-muted); font-size: var(--scale-sm); display: inline-flex; white-space: nowrap; }
  .dsInput__affix svg { width: 16px; height: 16px; }
  .dsInput--mono .dsInput__el { font-family: var(--font-mono); font-variant-numeric: tabular-nums; }
  `;
  const el = document.createElement('style');
  el.setAttribute('data-ds', 'input');
  el.textContent = css;
  document.head.appendChild(el);
}

export function Input({
  label,
  hint,
  error,
  required = false,
  size = 'md',
  prefix = null,
  suffix = null,
  mono = false,
  disabled = false,
  id,
  className = '',
  ...rest
}) {
  useInputStyles();
  const fieldId = id || (label ? 'in-' + label.toLowerCase().replace(/\s+/g, '-') : undefined);
  const box = (
    <div
      className={['dsInput', size !== 'md' ? `dsInput--${size}` : '', mono ? 'dsInput--mono' : '', className].filter(Boolean).join(' ')}
      data-invalid={Boolean(error)}
      data-disabled={disabled}
    >
      {prefix && <span className="dsInput__affix">{prefix}</span>}
      <input id={fieldId} className="dsInput__el" disabled={disabled} aria-invalid={Boolean(error)} {...rest} />
      {suffix && <span className="dsInput__affix">{suffix}</span>}
    </div>
  );

  if (!label && !hint && !error) return box;
  return (
    <div className="dsField">
      {label && <label className="dsField__label" htmlFor={fieldId}>{label}{required && <span className="dsField__req">*</span>}</label>}
      {box}
      {error ? <span className="dsField__error">{error}</span> : hint ? <span className="dsField__hint">{hint}</span> : null}
    </div>
  );
}
