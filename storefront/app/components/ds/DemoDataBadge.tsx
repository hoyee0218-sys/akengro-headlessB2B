/* DS DemoDataBadge — ported. CSS in app/styles/components.css.
   The literal "DEMO DATA" marker on every value that comes from a Mock seam
   provider (BUILD.md §0.1 / §7). */
import {t} from '~/lib/copy';

export function DemoDataBadge({
  corner = false,
  label = t('demo.badge'),
  className = '',
  ...rest
}: {
  corner?: boolean;
  label?: string;
  className?: string;
  [key: string]: any;
}) {
  return (
    <span
      className={['dsDemo', corner ? 'dsDemo--corner' : '', className]
        .filter(Boolean)
        .join(' ')}
      title={t('demo.badgeTitle')}
      {...rest}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 9v4M12 17h.01" />
        <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      </svg>
      {label}
    </span>
  );
}
