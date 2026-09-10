export interface DetailHeaderProps {
  /** ENIGMA designator — mono, accent, never wrapped mid-token. */
  designator: string;
  name: string;
  /** "Live marker", "Scheduled", "Historical". */
  tier?: string;
  onBack?: () => void;
}

export declare function DetailHeader(props: DetailHeaderProps): JSX.Element;
