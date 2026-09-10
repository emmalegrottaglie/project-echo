import type { ReactNode } from 'react';

export interface StatusLineProps {
  /** Short, lowercase, no trailing period. Never repeat unchanged text. */
  message?: string;
  tone?: 'neutral' | 'live' | 'danger' | 'ok';
  /** An inline recovery control, e.g. "try another receiver". */
  action?: ReactNode;
}

export declare function StatusLine(props: StatusLineProps): JSX.Element;
