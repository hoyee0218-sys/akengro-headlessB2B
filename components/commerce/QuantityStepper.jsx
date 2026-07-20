import React from 'react';

let injected = false;
function useStepperStyles() {
  if (injected || typeof document === 'undefined') return;
  injected = true;
  const css = `
  .dsStepper { display: inline-flex; align-items: stretch; border: 1px solid var(--border-strong); border-radius: var(--radius-control); overflow: clip; background: var(--surface-base); }
  .dsStepper:focus-within { border-color: var(--brand-accent); box-shadow: var(--ring); }
  .dsStepper__btn {
    display: inline-flex; align-items: center; justify-content: center;
    width: 36px; border: none; background: var(--surface-base); color: var(--text-primary);
    cursor: pointer; transition: var(--transition-control);
  }
  .dsStepper__btn:hover:not(:disabled) { background: var(--surface-sunken); }
  .dsStepper__btn:disabled { color: var(--text-muted); cursor: not-allowed; opacity: 0.5; }
  .dsStepper__btn svg { width: 16px; height: 16px; }
  .dsStepper__input {
    width: 52px; border: none; border-left: 1px solid var(--border-subtle); border-right: 1px solid var(--border-subtle);
    text-align: center; font-family: var(--font-mono); font-variant-numeric: tabular-nums;
    font-size: var(--scale-sm); color: var(--text-primary); background: transparent; outline: none;
    -moz-appearance: textfield;
  }
  .dsStepper__input::-webkit-outer-spin-button, .dsStepper__input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
  .dsStepper--sm .dsStepper__btn { width: 30px; } .dsStepper--sm .dsStepper__input { width: 44px; font-size: var(--scale-xs); }
  .dsStepper__unit { display: inline-flex; align-items: center; padding: 0 10px; font-size: var(--scale-xs); color: var(--text-muted); border-left: 1px solid var(--border-subtle); }
  `;
  const el = document.createElement('style');
  el.setAttribute('data-ds', 'stepper');
  el.textContent = css;
  document.head.appendChild(el);
}

export function QuantityStepper({
  value,
  defaultValue = 1,
  min = 1,
  max = Infinity,
  step = 1,
  unit = null,
  size = 'md',
  onChange,
  className = '',
}) {
  useStepperStyles();
  const controlled = value != null;
  const [internal, setInternal] = React.useState(defaultValue);
  const val = controlled ? value : internal;

  const set = (next) => {
    const clamped = Math.max(min, Math.min(max, next));
    if (!controlled) setInternal(clamped);
    onChange && onChange(clamped);
  };

  return (
    <span className={['dsStepper', size !== 'md' ? `dsStepper--${size}` : '', className].filter(Boolean).join(' ')}>
      <button type="button" className="dsStepper__btn" aria-label="Reduser" disabled={val <= min} onClick={() => set(val - step)}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M5 12h14"/></svg>
      </button>
      <input
        className="dsStepper__input"
        type="number"
        value={val}
        min={min}
        max={max === Infinity ? undefined : max}
        step={step}
        onChange={(e) => set(parseInt(e.target.value, 10) || min)}
      />
      {unit && <span className="dsStepper__unit">{unit}</span>}
      <button type="button" className="dsStepper__btn" aria-label="Øk" disabled={val >= max} onClick={() => set(val + step)}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
      </button>
    </span>
  );
}
