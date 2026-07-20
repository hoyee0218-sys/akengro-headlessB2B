import React from 'react';

let injected = false;
function useSelectStyles() {
  if (injected || typeof document === 'undefined') return;
  injected = true;
  const css = `
  .dsField { display: flex; flex-direction: column; gap: var(--space-2); font-family: var(--font-body); }
  .dsField__label { font: var(--text-label); color: var(--text-primary); display: flex; gap: 4px; align-items: baseline; }
  .dsField__req { color: var(--status-danger); }
  .dsField__hint { font-size: var(--scale-xs); color: var(--text-muted); }
  .dsField__error { font-size: var(--scale-xs); color: var(--status-danger-fg); }
  .dsSelect { position: relative; display: inline-flex; align-items: center; width: 100%; font-family: var(--font-body); }
  .dsSelect__el {
    appearance: none; width: 100%; height: 40px;
    padding: 0 var(--space-8) 0 var(--space-3);
    background: var(--surface-base);
    border: 1px solid var(--border-strong); border-radius: var(--radius-control);
    font: var(--text-body); color: var(--text-primary); cursor: pointer;
    transition: var(--transition-control);
  }
  .dsSelect__el:focus-visible { outline: none; border-color: var(--brand-accent); box-shadow: var(--ring); }
  .dsSelect__el:disabled { background: var(--surface-sunken); opacity: 0.7; cursor: not-allowed; }
  .dsSelect__el[data-invalid="true"] { border-color: var(--status-danger); }
  .dsSelect--sm .dsSelect__el { height: 32px; }
  .dsSelect--lg .dsSelect__el { height: 48px; }
  .dsSelect__chev {
    position: absolute; right: var(--space-3); pointer-events: none;
    width: 16px; height: 16px; color: var(--text-muted);
  }
  `;
  const el = document.createElement('style');
  el.setAttribute('data-ds', 'select');
  el.textContent = css;
  document.head.appendChild(el);
}

export function Select({
  options = [],
  size = 'md',
  placeholder,
  label,
  hint,
  error,
  required = false,
  id,
  className = '',
  children,
  ...rest
}) {
  useSelectStyles();
  const fieldId = id || (label ? 'sel-' + label.toLowerCase().replace(/\s+/g, '-') : undefined);
  const control = (
    <span className={['dsSelect', size !== 'md' ? `dsSelect--${size}` : '', className].filter(Boolean).join(' ')}>
      <select id={fieldId} className="dsSelect__el" data-invalid={Boolean(error)} aria-invalid={Boolean(error)} {...rest}>
        {placeholder && <option value="" disabled>{placeholder}</option>}
        {options.map((o) => {
          const opt = typeof o === 'string' ? { value: o, label: o } : o;
          return <option key={opt.value} value={opt.value}>{opt.label}</option>;
        })}
        {children}
      </select>
      <svg className="dsSelect__chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>
    </span>
  );

  if (!label && !hint && !error) return control;
  return (
    <div className="dsField">
      {label && <label className="dsField__label" htmlFor={fieldId}>{label}{required && <span className="dsField__req">*</span>}</label>}
      {control}
      {error ? <span className="dsField__error">{error}</span> : hint ? <span className="dsField__hint">{hint}</span> : null}
    </div>
  );
}
