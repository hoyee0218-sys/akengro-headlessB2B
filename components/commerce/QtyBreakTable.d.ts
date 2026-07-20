import * as React from 'react';

export interface PriceBreak {
  minQty: number;
  price: number;
}

/** Quantity-break pricing table (§7 getQuantityBreaks). Highlights the tier the current cart qty unlocks. */
export interface QtyBreakTableProps {
  breaks: PriceBreak[];
  currency?: string;
  locale?: string;
  /** Current quantity — highlights the active tier row. */
  currentQty?: number | null;
  /** Unit noun, default "stk". */
  unit?: string;
  className?: string;
}

export function QtyBreakTable(props: QtyBreakTableProps): JSX.Element;
