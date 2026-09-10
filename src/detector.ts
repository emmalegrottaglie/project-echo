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
 *
 * **What it thresholds matters more than the threshold.** The first version took the
 * loudest bin across the whole 0–3 kHz passband. That works on a synthetic tone, where
 * the tone *is* the loudest bin, and fails on a real receiver: a smoke test against The
 * Buzzer through a KiwiSDR in France showed twelve pulses plainly in the waterfall
 * while the detector never locked, because the band is loud everywhere and the
 * receiver's AGC keeps the floor high, so the buzz never crossed a threshold set from
 * the whole band's range.
 *
 * So it now works per bin. A slow baseline per bin estimates the noise floor; a pulsed
 * tone is whatever rises above *its own* baseline, which steady noise and steady
 * carriers do not. The bin that swings most is tracked, and its signed excursion is
 * what gets thresholded — with hysteresis, so one ragged pulse yields one edge.
 */

/** Periods outside this range are not channel markers. The Pip is ~1.2 s, the Buzzer ~2.4 s. */
const MIN_PERIOD_MS = 400;
const MAX_PERIOD_MS = 8000;

/**
 * Two edges closer together than the shortest plausible period cannot both be real, so
 * the second is a ragged top rather than a pulse.
 */
const DEBOUNCE_MS = MIN_PERIOD_MS;

/**
 * Time constant for smoothing the tracked bin's excursion before it is thresholded.
 *
 * A recording of The Buzzer through a KiwiSDR in France showed why this is needed: the
 * buzz is not a clean square. Its pulses carry brief dropouts, and the band around it
 * jitters frame to frame, so the raw excursion crosses any threshold repeatedly in both
 * directions — which turned one pulse into three edges and dragged the reported
 * consistency to 0.09 while the waterfall showed five textbook cycles.
 *
 * Short relative to the shortest marker pulse, so it removes single-frame noise without
 * blurring a real edge by more than about a tenth of a second.
 */
const SMOOTH_TAU_SEC = 0.12;

/**
 * Rising and falling thresholds, as fractions of the observed excursion range.
 *
 * Two of them, not one: a real pulse edge is noisy, and a single threshold turns one
 * transition into a burst of crossings or none at all.
 */
const RISE_FRACTION = 0.65;
const FALL_FRACTION = 0.35;

/**
 * Every constant below is in **seconds of wall time**, never in frames.
 *
 * The first version counted frames, and that was wrong for a reason worth recording:
 * the waterfall throttles to a target rate, drops frames under load, and stops
 * entirely in a background tab, so the frame rate is not something this app controls.
 * A warm-up of 240 frames took twelve seconds on a phone at 20 fps and over two
 * minutes in a throttled tab measured at 1.7 fps — same code, and in the second case
 * the detector never returned a verdict at all.
 *
 * Smoothing factors are therefore derived per frame from the elapsed time,
 * `1 - exp(-dt / tau)`, which makes the behaviour identical at any rate. This is the
 * same reasoning that put edge timing ahead of autocorrelation: the timestamps are
 * trustworthy, the cadence is not.
 */

/** Slow enough that a marker with a 50 % duty cycle cannot drag its own floor up. */
const BASELINE_TAU_SEC = 8;

/** Faster: it only has to identify which bin is pulsing. */
const SWING_TAU_SEC = 1;

/** Re-picking the tracked bin every frame would let it jitter between neighbours. */
const RETRACK_INTERVAL_MS = 800;

/**
 * Time to ignore before judging anything.
 *
 * The per-bin baseline starts at the first frame's values, so until it has settled the
 * excursions are skewed by wherever the marker happened to be at that instant. Timing
 * edges against that produced four correct intervals followed by a run of spurious
 * ones. Nothing is lost by waiting: four edges of a 2.4 s marker take ten seconds to
 * collect regardless.
 */
const WARMUP_MS = 11_000;

/**
 * Window used to set the thresholds — three Buzzer periods.
 *
 * Deliberately shorter than the edge history. Floor and ceiling have to describe
 * conditions *now*; taken over a long window they drift away from the current signal
 * and the thresholds end up low enough for band noise to trip them.
 */
const LEVEL_WINDOW_MS = 7_000;

/** Gaps larger than this are a stall, not a sample interval, and must not skew an EMA. */
const MAX_FRAME_GAP_MS = 500;

/**
 * How far the tracked bin must swing, on the analyser's 0–1 scale, before any of this
 * means anything. Below it the band is noise and reporting a period would be reporting
 * a pattern in hiss.
 */
const MIN_RANGE = 0.05;

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
  /** Observed excursion range of the tracked bin, on the analyser's 0–1 scale. */
  range: number;
  /** Which FFT bin is being watched, or null before one is chosen. */
  trackedBin: number | null;
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[middle - 1]! + sorted[middle]!) / 2
    : sorted[middle]!;
}

export class MarkerDetector {
  /** Slow per-bin noise floor. */
  private baseline: Float32Array | null = null;
  /** Smoothed absolute excursion per bin: which bin is pulsing. */
  private swing: Float32Array | null = null;
  private trackedBin: number | null = null;
  private startedAtMs: number | null = null;
  private lastFrameMs: number | null = null;
  private lastRetrackMs = 0;

  /** Smoothed excursion of the tracked bin. */
  private smoothed: number | null = null;
  /** Recent smoothed excursions of the tracked bin, with the time each was taken. */
  private levels: Array<{ atMs: number; level: number }> = [];
  private edges: number[] = [];
  private lastEdge = 0;
  /**
   * Whether the level has been seen below the falling threshold since warm-up.
   *
   * Warm-up ends wherever it ends, often part-way through a pulse, and accepting that
   * first partial rise puts one short interval into the median and drags the reported
   * consistency down. Waiting for a genuine off state first costs one cycle and makes
   * every interval a real one.
   */
  private armed = false;

  reset(): void {
    this.baseline = null;
    this.swing = null;
    this.trackedBin = null;
    this.startedAtMs = null;
    this.lastFrameMs = null;
    this.lastRetrackMs = 0;
    this.levels = [];
    this.edges = [];
    this.lastEdge = 0;
    this.armed = false;
    this.smoothed = null;
  }

  /**
   * Feeds one analyser frame.
   *
   * `bins` is the frame straight from `getByteFrequencyData` and is not retained — the
   * caller reuses the same array every frame.
   */
  feed(atMs: number, bins: Uint8Array): void {
    if (!this.baseline || this.baseline.length !== bins.length) {
      this.baseline = new Float32Array(bins.length);
      this.swing = new Float32Array(bins.length);
      for (let i = 0; i < bins.length; i++) this.baseline[i] = bins[i]! / 255;
    }

    this.startedAtMs ??= atMs;

    // Smoothing derived from elapsed time, so the frame rate cannot change the
    // behaviour. A stall is clamped rather than allowed to jump an EMA to the present.
    const dtMs = Math.min(Math.max(atMs - (this.lastFrameMs ?? atMs), 1), MAX_FRAME_GAP_MS);
    this.lastFrameMs = atMs;
    const baselineAlpha = 1 - Math.exp(-dtMs / 1000 / BASELINE_TAU_SEC);
    const swingAlpha = 1 - Math.exp(-dtMs / 1000 / SWING_TAU_SEC);

    const baseline = this.baseline;
    const swing = this.swing!;

    for (let i = 0; i < bins.length; i++) {
      const level = bins[i]! / 255;
      const excursion = level - baseline[i]!;
      baseline[i] = baseline[i]! + baselineAlpha * excursion;
      swing[i] = swing[i]! + swingAlpha * (Math.abs(excursion) - swing[i]!);
    }

    // The bin that swings most is the pulsing one: steady noise and steady carriers sit
    // on their own baselines however loud they are.
    if (atMs - this.lastRetrackMs >= RETRACK_INTERVAL_MS || this.trackedBin === null) {
      this.lastRetrackMs = atMs;
      let best = 0;
      let bestBin = 0;
      for (let i = 0; i < swing.length; i++) {
        if (swing[i]! > best) {
          best = swing[i]!;
          bestBin = i;
        }
      }
      this.trackedBin = bestBin;
    }

    const tracked = this.trackedBin;
    const excursion = bins[tracked]! / 255 - baseline[tracked]!;

    const smoothAlpha = 1 - Math.exp(-dtMs / 1000 / SMOOTH_TAU_SEC);
    this.smoothed = this.smoothed === null
      ? excursion
      : this.smoothed + smoothAlpha * (excursion - this.smoothed);
    const level = this.smoothed;

    this.levels.push({ atMs, level });
    while (this.levels.length > 1 && atMs - this.levels[0]!.atMs > LEVEL_WINDOW_MS) {
      this.levels.shift();
    }

    // Judge nothing until the baseline has settled.
    if (atMs - this.startedAtMs < WARMUP_MS) return;

    let floor = Infinity;
    let ceiling = -Infinity;
    for (const sample of this.levels) {
      if (sample.level < floor) floor = sample.level;
      if (sample.level > ceiling) ceiling = sample.level;
    }
    const range = ceiling - floor;
    if (range < MIN_RANGE) {
      this.armed = false;
      return;
    }

    const rise = floor + range * RISE_FRACTION;
    const fall = floor + range * FALL_FRACTION;

    // `armed` means a genuine off period has been observed since the last edge.
    // Smoothing is what makes that reliable: without it a single dropout inside a pulse
    // re-arms the detector and the pulse is counted twice.
    if (level <= fall) {
      this.armed = true;
      return;
    }

    if (this.armed && level >= rise && atMs - this.lastEdge >= DEBOUNCE_MS) {
      this.edges.push(atMs);
      if (this.edges.length > MAX_EDGES) this.edges.shift();
      this.lastEdge = atMs;
      this.armed = false;
    }
  }

  read(): Detection {
    const trackedBin = this.trackedBin;

    // Still warming up: "listening…" is the honest report, not a verdict on the band.
    if (this.startedAtMs === null || (this.lastFrameMs ?? 0) - this.startedAtMs < WARMUP_MS) {
      return {
        state: 'idle',
        periodSec: null,
        perMinute: null,
        consistency: 0,
        range: 0,
        trackedBin,
      };
    }

    const levels = this.levels.map((sample) => sample.level);
    const range = Math.max(...levels) - Math.min(...levels);
    if (range < MIN_RANGE) {
      return {
        state: 'absent',
        periodSec: null,
        perMinute: null,
        consistency: 0,
        range,
        trackedBin,
      };
    }

    if (this.edges.length < MIN_EDGES_FOR_PERIOD) {
      return {
        state: 'searching',
        periodSec: null,
        perMinute: null,
        consistency: 0,
        range,
        trackedBin,
      };
    }

    const intervals: number[] = [];
    for (let i = 1; i < this.edges.length; i++) {
      intervals.push(this.edges[i]! - this.edges[i - 1]!);
    }

    const period = median(intervals);
    if (period < MIN_PERIOD_MS || period > MAX_PERIOD_MS) {
      return {
        state: 'absent',
        periodSec: null,
        perMinute: null,
        consistency: 0,
        range,
        trackedBin,
      };
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
      trackedBin,
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
