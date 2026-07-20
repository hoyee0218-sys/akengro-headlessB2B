import * as React from 'react';

export type OrderStatus =
  | 'draft' | 'quote' | 'pending' | 'confirmed' | 'processing'
  | 'shipped' | 'delivered' | 'invoiced' | 'paid' | 'overdue'
  | 'cancelled' | 'returned';

/** Order-state badge — maps each B2B order state to the right tone + Norwegian label. */
export interface OrderStatusBadgeProps {
  status: OrderStatus;
  /** Override the default localized label. */
  label?: string;
  /** Show the leading status dot. Default true. */
  dot?: boolean;
}

export function OrderStatusBadge(props: OrderStatusBadgeProps): JSX.Element;
