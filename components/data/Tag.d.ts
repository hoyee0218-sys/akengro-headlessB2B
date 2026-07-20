import * as React from 'react';

/** Interactive filter chip — selectable and/or removable. Pass `onClick` to toggle, `onRemove` for a remove button. */
export interface TagProps extends Omit<React.HTMLAttributes<HTMLSpanElement>, 'onClick'> {
  selected?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  /** When set, renders a trailing × that calls this instead of toggling. */
  onRemove?: (e: React.MouseEvent) => void;
}

export function Tag(props: TagProps): JSX.Element;
