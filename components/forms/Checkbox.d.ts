import * as React from 'react';

/** Checkbox or radio (set `type="radio"`). Optional label + description; supports `indeterminate`. */
export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: React.ReactNode;
  description?: string;
  type?: 'checkbox' | 'radio';
  indeterminate?: boolean;
}

export function Checkbox(props: CheckboxProps): JSX.Element;
