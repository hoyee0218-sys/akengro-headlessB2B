import * as React from 'react';

/**
 * Catalog product card for the PLP grid. Composes PriceDisplay + StockIndicator + Button.
 * The price slot is entitlement-aware: pass `gated` (or `amount={null}`) for logged-out /
 * non-entitled customers so retail price + add-to-cart are hidden per the B2B pattern (§3, §7).
 *
 * @startingPoint section="Commerce" subtitle="Catalog product card — entitlement-aware price slot" viewport="320x420"
 */
export interface ProductCardProps extends React.HTMLAttributes<HTMLElement> {
  title: string;
  sku?: string;
  /** Product image URL. Omit for a neutral placeholder. */
  image?: string | null;
  /** Resolved customer price (PricingProvider). */
  amount?: number | null;
  listAmount?: number | null;
  currency?: string;
  locale?: string;
  vatMode?: 'ex' | 'inc';
  /** Hide price + add-to-cart (logged-out / non-entitled B2B). */
  gated?: boolean;
  stockStatus?: 'in' | 'low' | 'out' | 'backorder';
  leadTime?: string | null;
  onAddToCart?: (e: React.MouseEvent) => void;
  href?: string;
  cta?: string;
}

export function ProductCard(props: ProductCardProps): JSX.Element;
