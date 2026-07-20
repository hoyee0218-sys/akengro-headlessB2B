/* DS OrderStatusBadge — ported. Maps B2B order states → Badge tone + copy
   label via t('orderStatus.*') (BUILD.md §6). */
import {t} from '~/lib/copy';
import {Badge, type BadgeTone} from './Badge';

const STATE_TONES: Record<string, BadgeTone> = {
  draft: 'neutral',
  quote: 'info',
  pending: 'warning',
  confirmed: 'info',
  processing: 'info',
  shipped: 'info',
  delivered: 'success',
  invoiced: 'neutral',
  paid: 'success',
  overdue: 'danger',
  cancelled: 'danger',
  returned: 'warning',
};

export function OrderStatusBadge({
  status,
  label,
  dot = true,
  ...rest
}: {
  status: string;
  label?: string;
  dot?: boolean;
  [key: string]: any;
}) {
  const tone = STATE_TONES[status] || ('neutral' as BadgeTone);
  const resolvedLabel =
    label ||
    (STATE_TONES[status] ? t(`orderStatus.${status}`) : status);
  return (
    <Badge tone={tone} dot={dot} {...rest}>
      {resolvedLabel}
    </Badge>
  );
}
