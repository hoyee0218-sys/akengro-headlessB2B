import * as React from 'react';

/** Text field with optional label, hint, error, prefix/suffix affixes. Use `mono` for SKUs/qty/prices. */
export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'prefix' | 'size'> {
  label?: string;
  hint?: string;
  /** Error message; sets invalid styling when present. */
  error?: string;
  required?: boolean;
  size?: 'sm' | 'md' | 'lg';
  /** Node rendered inside, before the input (icon or text affix). */
  prefix?: React.ReactNode;
  /** Node rendered inside, after the input (unit, icon). */
  suffix?: React.ReactNode;
  /** Tabular monospace input — for SKUs, quantities, prices. */
  mono?: boolean;
}

export function Input(props: InputProps): JSX.Element;
