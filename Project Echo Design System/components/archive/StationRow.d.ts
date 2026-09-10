/**
 * Archive list row.
 *
 */
export interface StationRowProps {
  /** ENIGMA designator: mono, accent, never wrapped mid-token. */
  designator: string;
  name: string;
  operator: string;
  tier?: 'live' | 'scheduled' | 'historical';
  /** Published marker period, seconds — drives the live pulse rate. */
  periodSec?: number;
  /** Sources publish conflicting frequencies for this station. */
  disputed?: boolean;
  onOpen?: () => void;
}

export declare function StationRow(props: StationRowProps): JSX.Element;
