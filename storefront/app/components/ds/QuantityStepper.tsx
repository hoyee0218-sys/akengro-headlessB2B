/* DS QuantityStepper — ported. CSS in app/styles/components.css. */
import {useState} from 'react';
import {t} from '~/lib/copy';

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
}: {
  value?: number;
  defaultValue?: number;
  min?: number;
  max?: number;
  step?: number;
  unit?: string | null;
  size?: 'sm' | 'md';
  onChange?: (value: number) => void;
  className?: string;
}) {
  const controlled = value != null;
  const [internal, setInternal] = useState(defaultValue);
  const val = controlled ? (value as number) : internal;

  const set = (next: number) => {
    const clamped = Math.max(min, Math.min(max, next));
    if (!controlled) setInternal(clamped);
    onChange && onChange(clamped);
  };

  return (
    <span
      className={['dsStepper', size !== 'md' ? `dsStepper--${size}` : '', className]
        .filter(Boolean)
        .join(' ')}
    >
      <button
        type="button"
        className="dsStepper__btn"
        aria-label={t('qty.decrease')}
        disabled={val <= min}
        onClick={() => set(val - step)}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
          <path d="M5 12h14" />
        </svg>
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
      <button
        type="button"
        className="dsStepper__btn"
        aria-label={t('qty.increase')}
        disabled={val >= max}
        onClick={() => set(val + step)}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
          <path d="M12 5v14M5 12h14" />
        </svg>
      </button>
    </span>
  );
}
