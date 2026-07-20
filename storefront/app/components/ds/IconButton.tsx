/* DS IconButton — ported. CSS in app/styles/components.css. */
import type {ReactNode} from 'react';

export function IconButton({
  variant = 'ghost',
  size = 'md',
  label,
  badge = null,
  className = '',
  children,
  ...rest
}: {
  variant?: 'ghost' | 'outlined' | 'solid';
  size?: 'sm' | 'md' | 'lg';
  label: string;
  badge?: ReactNode;
  className?: string;
  children?: ReactNode;
  [key: string]: any;
}) {
  const cls = [
    'dsIconBtn',
    `dsIconBtn--${size}`,
    variant !== 'ghost' ? `dsIconBtn--${variant}` : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const btn = (
    <button className={cls} aria-label={label} title={label} {...rest}>
      {children}
    </button>
  );

  if (badge == null) return btn;
  return (
    <span className="dsIconBtn__wrap">
      {btn}
      <span className="dsIconBtn__badge">{badge}</span>
    </span>
  );
}
