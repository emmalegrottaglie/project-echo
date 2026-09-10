export interface ProvenanceRow {
  khz: number;
  mode: string;
  /** 'day' | 'night' | null when the frequency is not time-of-day dependent. */
  timeOfDay?: 'day' | 'night' | null;
  /** ISO date the cited source last confirmed it. */
  lastConfirmed: string;
  sourceUrl: string;
  /** Sources publish this frequency two ways and neither retracts the other. */
  disputed?: boolean;
}

export interface ProvenanceTableProps {
  rows: ProvenanceRow[];
}

export declare function ProvenanceTable(props: ProvenanceTableProps): JSX.Element;
