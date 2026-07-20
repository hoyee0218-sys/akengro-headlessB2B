import React from 'react';

let injected = false;
function useSwitchStyles() {
  if (injected || typeof document === 'undefined') return;
  injected = true;
  const css = `
  .dsSwitch { display: inline-flex; align-items: center; gap: var(--space-3); cursor: pointer; font-family: var(--font-body); }
  .dsSwitch[data-disabled="true"] { opacity: 0.5; cursor: not-allowed; }
  .dsSwitch__input { position: absolute; opacity: 0; width: 0; height: 0; }
  .dsSwitch__track {
    flex: none; width: 38px; height: 22px; padding: 2px;
    background: var(--gray-300); border-radius: var(--radius-pill);
    transition: background-color var(--motion-base) var(--ease-standard);
  }
  .dsSwitch__thumb {
    width: 18px; height: 18px; border-radius: 50%;
    background: #fff; box-shadow: var(--shadow-sm);
    transition: transform var(--motion-base) var(--ease-standard);
  }
  .dsSwitch__input:checked + .dsSwitch__track { background: var(--brand-primary); }
  .dsSwitch__input:checked + .dsSwitch__track .dsSwitch__thumb { transform: translateX(16px); }
  .dsSwitch__input:focus-visible + .dsSwitch__track { box-shadow: var(--ring); }
  .dsSwitch__label { font: var(--text-body); color: var(--text-primary); }
  `;
  const el = document.createElement('style');
  el.setAttribute('data-ds', 'switch');
  el.textContent = css;
  document.head.appendChild(el);
}

export function Switch({ label, disabled = false, className = '', ...rest }) {
  useSwitchStyles();
  return (
    <label className={['dsSwitch', className].filter(Boolean).join(' ')} data-disabled={disabled}>
      <input className="dsSwitch__input" type="checkbox" role="switch" disabled={disabled} {...rest} />
      <span className="dsSwitch__track"><span className="dsSwitch__thumb" /></span>
      {label && <span className="dsSwitch__label">{label}</span>}
    </label>
  );
}
