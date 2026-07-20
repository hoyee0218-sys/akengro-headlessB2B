/* DS Button — ported from the design system. Same API, markup and class names;
   CSS lives in app/styles/components.css (no runtime injection). */
import type {ReactNode} from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'accent' | 'danger';
type Size = 'sm' | 'md' | 'lg';

export function Button({
  variant = 'primary',
  size = 'md',
  block = false,
  loading = false,
  disabled = false,
  iconStart = null,
  iconEnd = null,
  as = 'button',
  className = '',
  children,
  ...rest
}: {
  variant?: Variant;
  size?: Size;
  block?: boolean;
  loading?: boolean;
  disabled?: boolean;
  iconStart?: ReactNode;
  iconEnd?: ReactNode;
  as?: any;
  className?: string;
  children?: ReactNode;
  [key: string]: any;
}) {
  const Tag = as;
  const cls = [
    'dsBtn',
    `dsBtn--${size}`,
    variant !== 'primary' ? `dsBtn--${variant}` : '',
    block ? 'dsBtn--block' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <Tag
      className={cls}
      disabled={Tag === 'button' ? disabled || loading : undefined}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading && <span className="dsBtn__spin" aria-hidden="true" />}
      {!loading && iconStart}
      {children}
      {!loading && iconEnd}
    </Tag>
  );
}
