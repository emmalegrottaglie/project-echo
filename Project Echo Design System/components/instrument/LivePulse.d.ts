export interface LivePulseProps {
  /** The station's published marker period, in seconds. Drives the animation period. */
  periodSec?: number;
  /** 6px in rows, 8px on the live view's receiver row. */
  size?: number;
  color?: string;
  title?: string;
}

export declare function LivePulse(props: LivePulseProps): JSX.Element;
