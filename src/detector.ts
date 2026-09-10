/**
 * Marker detection.
 *
 * Answers one question — "is this marker transmitting right now" — so the user does
 * not have to read the waterfall to find out. It measures the pulse *period* and
 * nothing else: no demodulation, no groups, no content. That boundary is the legal one
 * in docs/RESEARCH.md §5, not a scope preference.
 *
 * Method is edge timing rather than autocorrelation. The markers are on/off tones, so
 * thresholding and timing the rising edges is both simpler and more robust here: it
 * uses each sample's real timestamp, so it does not assume the sampling interval is
 * uniform. Frames drop, and an autocorrelation over a rAF-driven series would read
 * those drops as period error.
 */

/** Edges closer together than this are one pulse with a ragged top, not two pulses. */
const DEBOUNCE_MS = 250;

/** Periods outside this range are not channel markers. The Pip is ~1.2 s, the Buzzer ~2.4 s. */
const MIN_PERIOD_MS = 400;
const MAX_PERIOD_MS = 8000;

/** Rising-edge threshold, as a fraction of the observed dynamic range. */
const THRESHOLD_FRACTION = 0.55;

/**
 * A pulse must stand this far above the noise floor, on the analyser's 0–1 scale,
 * before any of this means anything. Below it the band is just noise and reporting a
 * period would be reporting a pattern in hiss.
 */
const MIN_RANGE = 0.12;

const MAX_EDGES = 12;
const MIN_EDGES_FOR_PERIOD = 4;

/** How consistent the intervals must be to call it a marker rather than random peaks. */
const MIN_CONSISTENCY = 0.7;
const INTERVAL_TOLERANCE = 0.2;

export type DetectorState = 'idle' | 'searching' | 'detected' | 'absent';

export interface Detection {
  state: DetectorState;
  /** Measured pulse period in seconds, or null when no consistent period was found. */
  periodSec: number | null;
  /** Pulses per minute, the unit the station profiles are published in. */
  perMinute: number | null;
  /** Fraction of intervals agreeing with the median, 0–1. */
  consistency: number;
  /** Observed dynamic range on the analyser's 0–1 scale. */
  range: number;
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[middle - 1]! + sorted[middle]!) / 2
    : sorted[middle]!;
}

export class MarkerDetector {
  /** Recent peak levels, used to track the floor and ceiling of the signal. */
  private levels: number[] = [];
  private edges: number[] = [];
  private above = false;
  private lastEdge = 0;

  constructor(private readonly windowSamples = 512) {}

  reset(): void {
    this.levels = [];
    this.edges = [];
    this.above = false;
    this.lastEdge = 0;
  }

  /**
   * Feeds one analyser frame.
   *
   * `level` is the frame's peak bin on a 0–1 scale. Peak rather than mean: a marker is
   * a narrowband tone, so it lifts one bin hard while barely moving the average across
   * the passband.
   */
  feed(atMs: number, level: number): void {
    this.levels.push(level);
    if (this.levels.length > this.windowSamples) this.levels.shift();

    const floor = Math.min(...this.levels);
    const ceiling = Math.max(...this.levels);
    if (ceiling - floor < MIN_RANGE) {
      this.above = false;
      return;
    }

    const threshold = floor + (ceiling - floor) * THRESHOLD_FRACTION;
    const nowAbove = level >= threshold;

    if (nowAbove && !this.above && atMs - this.lastEdge >= DEBOUNCE_MS) {
      this.edges.push(atMs);
      if (this.edges.length > MAX_EDGES) this.edges.shift();
      this.lastEdge = atMs;
    }
    this.above = nowAbove;
  }

  read(): Detection {
    if (this.levels.length < 8) {
      return { state: 'idle', periodSec: null, perMinute: null, consistency: 0, range: 0 };
    }

    const range = Math.max(...this.levels) - Math.min(...this.levels);
    if (range < MIN_RANGE) {
      return { state: 'absent', periodSec: null, perMinute: null, consistency: 0, range };
    }

    if (this.edges.length < MIN_EDGES_FOR_PERIOD) {
      return { state: 'searching', periodSec: null, perMinute: null, consistency: 0, range };
    }

    const intervals: number[] = [];
    for (let i = 1; i < this.edges.length; i++) {
      intervals.push(this.edges[i]! - this.edges[i - 1]!);
    }

    const period = median(intervals);
    if (period < MIN_PERIOD_MS || period > MAX_PERIOD_MS) {
      return { state: 'absent', periodSec: null, perMinute: null, consistency: 0, range };
    }

    const agreeing = intervals.filter(
      (interval) => Math.abs(interval - period) <= period * INTERVAL_TOLERANCE,
    ).length;
    const consistency = agreeing / intervals.length;

    return {
      state: consistency >= MIN_CONSISTENCY ? 'detected' : 'searching',
      periodSec: period / 1000,
      perMinute: 60_000 / period,
      consistency,
      range,
    };
  }
}

/** True when a measured period is within 25% of a station's published one. */
export function matchesExpected(measuredSec: number, expectedSec: number): boolean {
  return Math.abs(measuredSec - expectedSec) <= expectedSec * 0.25;
}

export function describe(detection: Detection, expectedSec: number | null): string {
  switch (detection.state) {
    case 'idle':
      return 'listening…';
    case 'absent':
      return 'no marker — band is noise, or the transmitter is off';
    case 'searching':
      return detection.periodSec
        ? `pulses present but irregular (${detection.consistency.toFixed(2)} consistency)`
        : 'pulses present, measuring period…';
    case 'detected': {
      const measured = `${detection.periodSec!.toFixed(2)} s (${detection.perMinute!.toFixed(0)}/min)`;
      if (expectedSec === null) return `marker detected, period ${measured}`;
      return matchesExpected(detection.periodSec!, expectedSec)
        ? `marker detected, period ${measured} — matches the published ${expectedSec.toFixed(2)} s`
        : `periodic signal at ${measured}, but the published period is ${expectedSec.toFixed(2)} s`;
    }
  }
}
