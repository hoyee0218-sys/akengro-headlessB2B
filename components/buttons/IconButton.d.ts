import * as React from 'react';

/** Square, icon-only control. Supply an accessible `label`. Optional count `badge` (e.g. cart). */
export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'ghost' | 'outlined' | 'solid';
  size?: 'sm' | 'md' | 'lg';
  /** Accessible name — required since there is no visible text. */
  label: string;
  /** Numeric/string badge shown top-right (cart count, notifications). */
  badge?: React.ReactNode;
}

export function IconButton(props: IconButtonProps): JSX.Element;
