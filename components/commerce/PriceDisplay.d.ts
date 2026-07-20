import * as React from 'react';

/**
 * Entitlement-aware price (§6, §7). Renders the resolved customer price with VAT mode
 * and NOK formatting; shows a gated "log in for price" state when no entitlement.
 * The amount MUST come from the server-side PricingProvider — never compute client-side.
 *
 * @startingPoint section="Commerce" subtitle="Price display — ex/inc VAT, list vs your price, gated" viewport="700x200"
 */
export interface PriceDisplayProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Resolved customer price (from PricingProvider). Null/undefined renders the gated state. */
  amount?: number | null;
  /** Optional list/RRP price for a strikethrough + savings badge. */
  listAmount?: number | null;
  /** ISO currency. Default "NOK". */
  currency?: string;
  /** BCP-47 locale for formatting. Default "nb-NO". */
  locale?: string;
  /** "ex" shows "eks. mva", "inc" shows "inkl. mva". Drive from merchant.config.vatMode. */
  vatMode?: 'ex' | 'inc';
  size?: 'sm' | 'md' | 'lg';
  /** Force the gated (not-logged-in / no-entitlement) state. */
  gated?: boolean;
}

export function PriceDisplay(props: PriceDisplayProps): JSX.Element;
