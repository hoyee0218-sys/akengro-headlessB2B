import React from 'react';

let injected = false;
function useCheckboxStyles() {
  if (injected || typeof document === 'undefined') return;
  injected = true;
  const css = `
  .dsCheck { display: inline-flex; align-items: flex-start; gap: var(--space-2); cursor: pointer; font-family: var(--font-body); }
  .dsCheck[data-disabled="true"] { opacity: 0.5; cursor: not-allowed; }
  .dsCheck__input { position: absolute; opacity: 0; width: 0; height: 0; }
  .dsCheck__box {
    flex: none; width: 18px; height: 18px; margin-top: 1px;
    display: inline-flex; align-items: center; justify-content: center;
    border: 1.5px solid var(--border-strong); border-radius: var(--radius-xs);
    background: var(--surface-base); color: var(--brand-on-primary);
    transition: var(--transition-control);
  }
  .dsCheck__box svg { width: 13px; height: 13px; opacity: 0; transform: scale(0.6); transition: opacity var(--motion-fast), transform var(--motion-fast) var(--ease-standard); }
  .dsCheck__input:checked + .dsCheck__box,
  .dsCheck__input:indeterminate + .dsCheck__box { background: var(--brand-primary); border-color: var(--brand-primary); }
  .dsCheck__input:checked + .dsCheck__box svg,
  .dsCheck__input:indeterminate + .dsCheck__box svg { opacity: 1; transform: scale(1); }
  .dsCheck__input:focus-visible + .dsCheck__box { box-shadow: var(--ring); border-color: var(--brand-accent); }
  .dsCheck__label { font: var(--text-body); color: var(--text-primary); line-height: 1.3; }
  .dsCheck__desc { display: block; font-size: var(--scale-xs); color: var(--text-muted); margin-top: 2px; }
  .dsCheck--radio .dsCheck__box { border-radius: var(--radius-pill); }
  .dsCheck--radio .dsCheck__dot { width: 8px; height: 8px; border-radius: 50%; background: var(--brand-on-primary); opacity: 0; transform: scale(0.4); transition: opacity var(--motion-fast), transform var(--motion-fast); }
  .dsCheck--radio .dsCheck__input:checked + .dsCheck__box .dsCheck__dot { opacity: 1; transform: scale(1); }
  `;
  const el = document.createElement('style');
  el.setAttribute('data-ds', 'checkbox');
  el.textContent = css;
  document.head.appendChild(el);
}

export function Checkbox({
  label,
  description,
  type = 'checkbox',
  indeterminate = false,
  disabled = false,
  className = '',
  ...rest
}) {
  useCheckboxStyles();
  const ref = React.useRef(null);
  React.useEffect(() => { if (ref.current) ref.current.indeterminate = indeterminate; }, [indeterminate]);
  const isRadio = type === 'radio';

  return (
    <label className={['dsCheck', isRadio ? 'dsCheck--radio' : '', className].filter(Boolean).join(' ')} data-disabled={disabled}>
      <input ref={ref} className="dsCheck__input" type={type} disabled={disabled} {...rest} />
      <span className="dsCheck__box">
        {isRadio
          ? <span className="dsCheck__dot" />
          : indeterminate
            ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round"><path d="M5 12h14"/></svg>
            : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>}
      </span>
      {(label || description) && (
        <span className="dsCheck__label">{label}{description && <span className="dsCheck__desc">{description}</span>}</span>
      )}
    </label>
  );
}
