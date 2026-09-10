import type { ReactNode } from 'react';

export interface DetailListItem {
  /** Uppercase label: Classification, Operator, Status, Marker, Also known as. */
  label: string;
  value: ReactNode;
}

export interface DetailListProps {
  items: DetailListItem[];
}

export declare function DetailList(props: DetailListProps): JSX.Element;
