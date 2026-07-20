import * as React from 'react';

/** Compact status/label pill. Use status tones for stock, order state, credit. */
export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'outline' | 'solid';
  /** Leading status dot. */
  dot?: boolean;
}

export function Badge(props: BadgeProps): JSX.Element;
