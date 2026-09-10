export interface TierHeaderProps {
  /** "Live markers", "Scheduled", "Historical". */
  label: string;
  count?: number;
}

export declare function TierHeader(props: TierHeaderProps): JSX.Element;
