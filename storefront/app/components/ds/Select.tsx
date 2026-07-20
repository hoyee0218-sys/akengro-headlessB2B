/* DS Select — ported. CSS in app/styles/components.css. */
import type {ReactNode} from 'react';

type Opt = string | {value: string; label: string};

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
}: {
  options?: Opt[];
  size?: 'sm' | 'md' | 'lg';
  placeholder?: string;
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  id?: string;
  className?: string;
  children?: ReactNode;
  [key: string]: any;
}) {
  const fieldId =
    id || (label ? 'sel-' + label.toLowerCase().replace(/\s+/g, '-') : undefined);
  const control = (
    <span
      className={['dsSelect', size !== 'md' ? `dsSelect--${size}` : '', className]
        .filter(Boolean)
        .join(' ')}
    >
      <select
        id={fieldId}
        className="dsSelect__el"
        data-invalid={Boolean(error)}
        aria-invalid={Boolean(error)}
        {...rest}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((o) => {
          const opt = typeof o === 'string' ? {value: o, label: o} : o;
          return (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          );
        })}
        {children}
      </select>
      <svg
        className="dsSelect__chev"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    </span>
  );

  if (!label && !hint && !error) return control;
  return (
    <div className="dsField">
      {label && (
        <label className="dsField__label" htmlFor={fieldId}>
          {label}
          {required && <span className="dsField__req">*</span>}
        </label>
      )}
      {control}
      {error ? (
        <span className="dsField__error">{error}</span>
      ) : hint ? (
        <span className="dsField__hint">{hint}</span>
      ) : null}
    </div>
  );
}
