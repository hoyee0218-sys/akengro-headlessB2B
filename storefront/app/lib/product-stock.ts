import type {StockStatus} from '~/components/ds/StockIndicator';

type VariantLike = {
  availableForSale?: boolean | null;
  sku?: string | null;
};

type OptionValueLike = {
  /** Combination exists as a real variant (Hydrogen `getProductOptions`). */
  exists?: boolean;
  /** Encoded availability bitmap from Storefront. */
  available?: boolean;
  variant?: VariantLike | null;
};

/** Map Storefront variant availability to the StockIndicator contract. */
export function variantStockStatus(variant: VariantLike | null | undefined): StockStatus {
  if (!variant) return 'out';
  return variant.availableForSale ? 'in' : 'out';
}

/**
 * Size/color swatches stay selectable when the option combination exists.
 * Sold-out variants are selectable (to inspect that SKU); only missing
 * combinations are blocked — matching Hydrogen ProductForm (`disabled={!exists}`).
 */
export function isOptionValueSelectable(value: OptionValueLike): boolean {
  return Boolean(value.exists);
}

/**
 * Whether an option value is in stock for styling.
 * Prefer the linked variant's `availableForSale` (updates immediately after
 * inventory edits) over the encoded availability bitmap, which can lag.
 */
export function isOptionValueInStock(value: OptionValueLike): boolean {
  if (value.variant?.availableForSale != null) {
    return Boolean(value.variant.availableForSale);
  }
  return Boolean(value.available);
}
