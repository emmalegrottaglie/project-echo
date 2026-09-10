import type { ReactNode } from 'react';

export interface FlagProps {
  tone?: 'accent' | 'dim' | 'danger' | 'ok';
  /** One or two words, uppercased by the component. */
  children?: ReactNode;
}

export declare function Flag(props: FlagProps): JSX.Element;
