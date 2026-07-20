/* DS Badge — ported. CSS in app/styles/components.css. */
import type {ReactNode} from 'react';

export type BadgeTone =
  | 'neutral'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'outline'
  | 'solid';

export function Badge({
  tone = 'neutral',
  dot = false,
  className = '',
  children,
  ...rest
}: {
  tone?: BadgeTone;
  dot?: boolean;
  className?: string;
  children?: ReactNode;
  [key: string]: any;
}) {
  return (
    <span
      className={['dsBadge', `dsBadge--${tone}`, className].filter(Boolean).join(' ')}
      {...rest}
    >
      {dot && <span className="dsBadge__dot" />}
      {children}
    </span>
  );
}
