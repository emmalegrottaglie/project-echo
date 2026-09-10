import type { CSSProperties } from 'react';

export interface SegmentedOption {
  value: string;
  label: string;
}

/** Mutually exclusive filter, three or four segments. */
export interface SegmentedControlProps {
  options: SegmentedOption[];
  value: string;
  onChange?: (value: string) => void;
  style?: CSSProperties;
}

export declare function SegmentedControl(props: SegmentedControlProps): JSX.Element;
