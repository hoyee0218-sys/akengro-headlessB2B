/* DS StockIndicator — ported. CSS in app/styles/components.css.
   Status labels from the copy layer (readme CONTENT FUNDAMENTALS). */

import {t} from '~/lib/copy';

export type StockStatus = 'in' | 'low' | 'out' | 'backorder';

export function StockIndicator({
  status = 'in',
  qty = null,
  leadTime = null,
  label,
  className = '',
  ...rest
}: {
  status?: StockStatus;
  qty?: number | null;
  leadTime?: string | null;
  label?: string;
  className?: string;
  [key: string]: any;
}) {
  let text = label || t(`stock.${status}`);
  if (status === 'low' && qty != null) {
    text = t('stock.lowWithQty', {qty});
  }
  return (
    <span className={['dsStock', `dsStock--${status}`, className].filter(Boolean).join(' ')} {...rest}>
      <span className="dsStock__dot" />
      <span>{text}</span>
      {leadTime && <span className="dsStock__lead">· {leadTime}</span>}
    </span>
  );
}
