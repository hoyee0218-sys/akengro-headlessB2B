/* DS Card — ported. CSS in app/styles/components.css. */
import type {ReactNode} from 'react';

export function Card({
  elevation = 'flat',
  interactive = false,
  title,
  headerAction,
  footer,
  padded = true,
  className = '',
  children,
  ...rest
}: {
  elevation?: 'flat' | 'raised';
  interactive?: boolean;
  title?: ReactNode;
  headerAction?: ReactNode;
  footer?: ReactNode;
  padded?: boolean;
  className?: string;
  children?: ReactNode;
  [key: string]: any;
}) {
  const cls = [
    'dsCard',
    `dsCard--${elevation}`,
    interactive ? 'dsCard--interactive' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <div className={cls} tabIndex={interactive ? 0 : undefined} {...rest}>
      {title && (
        <div className="dsCard__header">
          <span className="dsCard__title">{title}</span>
          {headerAction}
        </div>
      )}
      {padded ? <div className="dsCard__pad">{children}</div> : children}
      {footer && <div className="dsCard__footer">{footer}</div>}
    </div>
  );
}
