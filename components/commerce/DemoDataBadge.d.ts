import * as React from 'react';

/**
 * "DEMO DATA" marker (§7). Place anywhere mock data from an integration seam is shown
 * so the partner always knows which values are not yet wired to real systems.
 */
export interface DemoDataBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Absolutely position top-right of the nearest positioned ancestor. */
  corner?: boolean;
  label?: string;
}

export function DemoDataBadge(props: DemoDataBadgeProps): JSX.Element;
