import * as React from 'react';

/**
 * Primary action control. Token-driven; variants map to brand + status tokens.
 *
 * @startingPoint section="Core" subtitle="Buttons — primary, secondary, ghost, accent, danger" viewport="700x200"
 */
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual style. Default "primary" (ink). "accent" uses the merchant spot color. */
  variant?: 'primary' | 'secondary' | 'ghost' | 'accent' | 'danger';
  /** Control height. Default "md" (40px). */
  size?: 'sm' | 'md' | 'lg';
  /** Stretch to full width of container. */
  block?: boolean;
  /** Show spinner and disable interaction. */
  loading?: boolean;
  /** Icon node rendered before the label. */
  iconStart?: React.ReactNode;
  /** Icon node rendered after the label. */
  iconEnd?: React.ReactNode;
  /** Render as a different element, e.g. "a" for links. Default "button". */
  as?: 'button' | 'a';
}

export function Button(props: ButtonProps): JSX.Element;
