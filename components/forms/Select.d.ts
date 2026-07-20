import * as React from 'react';

export interface SelectOption {
  value: string;
  label: string;
}

/** Native select with custom chevron and token styling. Pass `options` or `<option>` children. Supports `label`/`hint`/`error` like Input. */
export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  /** Option list — strings or {value,label} objects. */
  options?: Array<string | SelectOption>;
  size?: 'sm' | 'md' | 'lg';
  /** Disabled leading placeholder option. */
  placeholder?: string;
  /** Field label rendered above the control. */
  label?: string;
  /** Helper text below the control. */
  hint?: string;
  /** Error message; sets invalid styling when present. */
  error?: string;
  required?: boolean;
}

export function Select(props: SelectProps): JSX.Element;
