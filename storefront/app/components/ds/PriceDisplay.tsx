/* DS PriceDisplay — ported. CSS in app/styles/components.css.
   Money formatting via formatMoney (narrow currency symbols: $, kr, €). */

import {formatMoney} from '~/lib/format';
import {t} from '~/lib/copy';

export function PriceDisplay({
  amount,
  listAmount = null,
  currency = 'NOK',
  locale = 'nb-NO',
  vatMode = 'ex',
  size = 'xs',
  gated = false,
  className = '',
  ...rest
}: {
  amount?: number | null;
  listAmount?: number | null;
  currency?: string;
  locale?: string;
  vatMode?: 'ex' | 'inc';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  gated?: boolean;
  className?: string;
  [key: string]: any;
}) {
  if (gated || amount == null) {
    return (
      <span className={['dsPrice__gated', className].filter(Boolean).join(' ')} {...rest}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect width="18" height="11" x="3" y="11" rx="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
        {t('price.loginForPrice')}
      </span>
    );
  }

  const vatLabel = vatMode === 'inc' ? t('price.incVat') : t('price.exVat');
  // Show Admin compare-at / list beside the selling price whenever it differs.
  const hasList = listAmount != null && listAmount !== amount;
  // Savings badge only when compare-at is a true markdown (higher than sell price).
  const isMarkdown = hasList && (listAmount as number) > amount;
  const pct = isMarkdown
    ? Math.round((1 - amount / (listAmount as number)) * 100)
    : 0;

  const format = (value: number) =>
    formatMoney(value, {currency, locale, minimumFractionDigits: 2});

  return (
    <span className={['dsPrice', `dsPrice--${size}`, className].filter(Boolean).join(' ')} {...rest}>
      <span className="dsPrice__row">
        <span className="dsPrice__amount">{format(amount)}</span>
        {hasList && (
          <span className="dsPrice__list">{format(listAmount as number)}</span>
        )}
      </span>
      <span className="dsPrice__row">
        <span className="dsPrice__vat">{vatLabel}</span>
        {isMarkdown && (
          <span className="dsPrice__save">
            {t('price.yourPriceSave', {pct})}
          </span>
        )}
      </span>
    </span>
  );
}
