import type { ReactNode } from 'react';

export interface GapNoticeLink {
  label: string;
  url: string;
  description?: string;
}

/**
 * A stated data gap with a route onward.
 *
 */
export interface GapNoticeProps {
  /** Uppercase mono heading, e.g. "Roster entry". */
  title?: string;
  children?: ReactNode;
  links?: GapNoticeLink[];
}

export declare function GapNotice(props: GapNoticeProps): JSX.Element;
