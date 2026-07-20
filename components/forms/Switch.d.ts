import * as React from 'react';

/** Binary toggle for settings (e.g. ex/inc VAT display, notifications). */
export interface SwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: React.ReactNode;
}

export function Switch(props: SwitchProps): JSX.Element;
