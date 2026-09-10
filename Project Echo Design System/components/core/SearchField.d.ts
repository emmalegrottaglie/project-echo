import type { CSSProperties } from 'react';

export interface SearchFieldProps {
  value: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  style?: CSSProperties;
}

export declare function SearchField(props: SearchFieldProps): JSX.Element;
