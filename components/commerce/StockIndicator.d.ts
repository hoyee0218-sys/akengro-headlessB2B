import * as React from 'react';

/** Stock / lead-time status with colored dot. Norwegian labels by default (i18n-ready, §6). */
export interface StockIndicatorProps extends React.HTMLAttributes<HTMLSpanElement> {
  status?: 'in' | 'low' | 'out' | 'backorder';
  /** Remaining quantity, appended for "low" state. */
  qty?: number | null;
  /** Lead-time text, e.g. "sendes i dag", "3–5 virkedager". */
  leadTime?: string | null;
  /** Override the default Norwegian label. */
  label?: string;
}

export function StockIndicator(props: StockIndicatorProps): JSX.Element;
