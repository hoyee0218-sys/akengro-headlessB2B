import * as React from 'react';

/** Surface container with optional header/footer. The structural unit of dashboards & account views. */
export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  elevation?: 'flat' | 'raised';
  /** Hover-lift + focus ring; use for clickable cards. */
  interactive?: boolean;
  /** Optional header title (rendered with a divider). */
  title?: React.ReactNode;
  /** Node aligned to the right of the header. */
  headerAction?: React.ReactNode;
  /** Footer content (rendered with a top divider). */
  footer?: React.ReactNode;
  /** Apply default body padding. Set false for edge-to-edge media/tables. Default true. */
  padded?: boolean;
}

export function Card(props: CardProps): JSX.Element;
