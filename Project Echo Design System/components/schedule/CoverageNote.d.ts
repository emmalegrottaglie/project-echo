import type { ReactNode } from 'react';

export interface CoverageNoteProps {
  /** e.g. "1 of 26 scheduled stations have imported schedules." */
  coverage?: string;
  /** Four states; denied is not recoverable in-app and must say so. */
  permission?: 'default' | 'granted' | 'denied' | 'unsupported';
  /** Only render the enable control in the 'default' state. */
  action?: ReactNode;
}

export declare function CoverageNote(props: CoverageNoteProps): JSX.Element;
