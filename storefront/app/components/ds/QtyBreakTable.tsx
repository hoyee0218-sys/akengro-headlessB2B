/* DS QtyBreakTable — ported. CSS in app/styles/components.css.
   Quantity-break pricing; in production fed by PricingProvider.getQuantityBreaks. */

import {formatMoney} from '~/lib/format';
import {t} from '~/lib/copy';

export interface PriceBreak {
  minQty: number;
  price: number;
}

export function QtyBreakTable({
  breaks = [],
  currency = 'NOK',
  locale = 'nb-NO',
  currentQty = null,
  unit,
  className = '',
}: {
  breaks?: PriceBreak[];
  currency?: string;
  locale?: string;
  currentQty?: number | null;
  unit?: string;
  className?: string;
}) {
  const unitLabel = unit ?? t('qty.unit');
  const sorted = [...breaks].sort((a, b) => a.minQty - b.minQty);
  const base = sorted.length ? sorted[0].price : 0;
  let activeIdx = -1;
  if (currentQty != null) {
    sorted.forEach((b, i) => {
      if (currentQty >= b.minQty) activeIdx = i;
    });
  }

  return (
    <table className={['dsBreak', className].filter(Boolean).join(' ')}>
      <thead>
        <tr>
          <th>{t('qty.count')}</th>
          <th>{t('qty.pricePer', {unit: unitLabel})}</th>
        </tr>
      </thead>
      <tbody>
        {sorted.map((b, i) => {
          const pct = base > 0 ? Math.round((1 - b.price / base) * 100) : 0;
          return (
            <tr key={b.minQty} data-active={i === activeIdx}>
              <td>
                {b.minQty}+ {unitLabel}
              </td>
              <td>
                {formatMoney(b.price, {currency, locale, minimumFractionDigits: 2})}
                {pct > 0 && <span className="dsBreak__save">−{pct}%</span>}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
