import * as React from 'react';

export interface TabItem {
  value: string;
  label: React.ReactNode;
  /** Optional count pill (e.g. order counts per status). */
  count?: number;
}

/** Underline tab bar for account sections and PDP detail panels. Controlled via `value`/`onChange`. */
export interface TabsProps {
  tabs: Array<string | TabItem>;
  value: string;
  onChange?: (value: string) => void;
  className?: string;
}

export function Tabs(props: TabsProps): JSX.Element;
