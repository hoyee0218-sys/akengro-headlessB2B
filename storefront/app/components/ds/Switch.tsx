/* DS Switch — ported. CSS in app/styles/components.css. */
export function Switch({
  label,
  disabled = false,
  className = '',
  ...rest
}: {
  label?: string;
  disabled?: boolean;
  className?: string;
  [key: string]: any;
}) {
  return (
    <label
      className={['dsSwitch', className].filter(Boolean).join(' ')}
      data-disabled={disabled}
    >
      <input
        className="dsSwitch__input"
        type="checkbox"
        role="switch"
        disabled={disabled}
        {...rest}
      />
      <span className="dsSwitch__track">
        <span className="dsSwitch__thumb" />
      </span>
      {label && <span className="dsSwitch__label">{label}</span>}
    </label>
  );
}
