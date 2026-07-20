/* DS Checkbox / Radio — ported. CSS in app/styles/components.css. */
import {useEffect, useRef} from 'react';

export function Checkbox({
  label,
  description,
  type = 'checkbox',
  indeterminate = false,
  disabled = false,
  className = '',
  ...rest
}: {
  label?: string;
  description?: string;
  type?: 'checkbox' | 'radio';
  indeterminate?: boolean;
  disabled?: boolean;
  className?: string;
  [key: string]: any;
}) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate;
  }, [indeterminate]);
  const isRadio = type === 'radio';

  return (
    <label
      className={['dsCheck', isRadio ? 'dsCheck--radio' : '', className]
        .filter(Boolean)
        .join(' ')}
      data-disabled={disabled}
    >
      <input
        ref={ref}
        className="dsCheck__input"
        type={type}
        disabled={disabled}
        {...rest}
      />
      <span className="dsCheck__box">
        {isRadio ? (
          <span className="dsCheck__dot" />
        ) : indeterminate ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round">
            <path d="M5 12h14" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6 9 17l-5-5" />
          </svg>
        )}
      </span>
      {(label || description) && (
        <span className="dsCheck__label">
          {label}
          {description && <span className="dsCheck__desc">{description}</span>}
        </span>
      )}
    </label>
  );
}
