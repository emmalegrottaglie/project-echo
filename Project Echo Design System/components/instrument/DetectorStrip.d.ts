/**
 * Live detector readout, four states.
 *
 */
export interface DetectorStripProps {
  state?: 'idle' | 'searching' | 'detected' | 'absent';
  /** Measured period in seconds. */
  periodSec?: number;
  /** Measured pulses per minute — the unit station profiles are published in. */
  perMinute?: number;
  /** The station's published period, for the match/mismatch wording. */
  expectedSec?: number;
  /** Fraction of intervals agreeing with the median, 0–1. Shown while searching. */
  consistency?: number;
}

export declare function DetectorStrip(props: DetectorStripProps): JSX.Element;
