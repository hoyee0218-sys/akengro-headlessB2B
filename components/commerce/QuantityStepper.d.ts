import * as React from 'react';

/** Quantity stepper for cart/PDP. Controlled (`value`+`onChange`) or uncontrolled (`defaultValue`). Respects `step` for case quantities. */
export interface QuantityStepperProps {
  value?: number;
  defaultValue?: number;
  min?: number;
  max?: number;
  /** Increment — set to case/pack size for B2B (e.g. 12). */
  step?: number;
  /** Trailing unit label, e.g. "stk", "kart.". */
  unit?: React.ReactNode;
  size?: 'sm' | 'md';
  onChange?: (value: number) => void;
  className?: string;
}

export function QuantityStepper(props: QuantityStepperProps): JSX.Element;
