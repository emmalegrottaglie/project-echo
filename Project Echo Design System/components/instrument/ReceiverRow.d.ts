import type { ReactNode } from 'react';

export interface ReceiverRowProps {
  /** Uppercase 12px sans label: "Receiver", "Station". */
  label: string;
  /** Mono value. Truncates on one line — never wraps. */
  value: string;
  /** Dim trailing detail: grid square, frequency and mode. */
  meta?: ReactNode;
  /** Live tier: carries the pulse at the station's own period. */
  live?: boolean;
  periodSec?: number;
  /** A <Flag> for disputed frequencies. */
  flag?: ReactNode;
  onOpen?: () => void;
}

export declare function ReceiverRow(props: ReceiverRowProps): JSX.Element;
