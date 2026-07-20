/* DS Input — ported. CSS in app/styles/components.css. */
import type {ReactNode} from 'react';

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
}: {
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  size?: 'sm' | 'md' | 'lg';
  prefix?: ReactNode;
  suffix?: ReactNode;
  mono?: boolean;
  disabled?: boolean;
  id?: string;
  className?: string;
  [key: string]: any;
}) {
  const fieldId =
    id || (label ? 'in-' + label.toLowerCase().replace(/\s+/g, '-') : undefined);
  const box = (
    <div
      className={[
        'dsInput',
        size !== 'md' ? `dsInput--${size}` : '',
        mono ? 'dsInput--mono' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      data-invalid={Boolean(error)}
      data-disabled={disabled}
    >
      {prefix && <span className="dsInput__affix">{prefix}</span>}
      <input
        id={fieldId}
        className="dsInput__el"
        disabled={disabled}
        aria-invalid={Boolean(error)}
        {...rest}
      />
      {suffix && <span className="dsInput__affix">{suffix}</span>}
    </div>
  );

  if (!label && !hint && !error) return box;
  return (
    <div className="dsField">
      {label && (
        <label className="dsField__label" htmlFor={fieldId}>
          {label}
          {required && <span className="dsField__req">*</span>}
        </label>
      )}
      {box}
      {error ? (
        <span className="dsField__error">{error}</span>
      ) : hint ? (
        <span className="dsField__hint">{hint}</span>
      ) : null}
    </div>
  );
}
