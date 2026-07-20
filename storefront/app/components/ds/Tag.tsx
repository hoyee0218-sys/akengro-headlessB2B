/* DS Tag — ported. CSS in app/styles/components.css. */
import type {ReactNode} from 'react';
import {t} from '~/lib/copy';

export function Tag({
  selected = false,
  onRemove,
  onClick,
  className = '',
  children,
  ...rest
}: {
  selected?: boolean;
  onRemove?: (e: any) => void;
  onClick?: (e: any) => void;
  className?: string;
  children?: ReactNode;
  [key: string]: any;
}) {
  const interactive = Boolean(onClick);
  const cls = [
    'dsTag',
    selected ? 'dsTag--selected' : '',
    interactive ? 'dsTag--button' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <span
      className={cls}
      onClick={onClick}
      role={interactive ? 'button' : undefined}
      {...rest}
    >
      {children}
      {onRemove && (
        <button
          className="dsTag__remove"
          aria-label={t('tag.remove')}
          onClick={(e) => {
            e.stopPropagation();
            onRemove(e);
          }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      )}
    </span>
  );
}
