import { describe as group, expect, it } from 'vitest';
import { describe, matchesExpected, MarkerDetector } from '../src/detector';

/**
 * The detector is the app's one piece of interpretation: it decides whether a marker is
 * on the air and what its period is. Everything else on the live screen renders what
 * this returns, so its thresholds are worth pinning.
 *
 * These tests feed synthesised **spectra**, not scalar levels, because that is what the
 * detector consumes and because the shape of the spectrum is what the first
 * implementation got wrong. The case that matters most is `a real receiver's band`
 * below: loud wideband noise with a modest pulsed tone on top, which is what a KiwiSDR
 * actually delivers and what the earlier whole-passband peak could not lock onto.
 */

const BINS = 512;
const FRAME_MS = 45;

interface BandOptions {
  /** Broadband noise level, 0–1. A real receiver with AGC sits high here. */
  noise: number;
  /** Per-bin random variation of that noise, 0–1. */
  jitter?: number;
  /** Bin carrying the marker tone. */
  toneBin?: number;
  /** How far above the noise the tone rises when it is on, 0–1. */
  toneLevel?: number;
  /** A constant tone, on in every frame — a carrier, not a marker. */
  carrierBin?: number;
  carrierLevel?: number;
  /**
   * Punch a brief gap into the middle of every pulse, the way a real buzz does. A
   * recording of The Buzzer through a KiwiSDR shows single-frame dropouts inside
   * otherwise clean 28-frame pulses.
   */
  dropouts?: boolean;
}

function frame(options: BandOptions, toneOn: boolean, seed: number): Uint8Array {
  const bins = new Uint8Array(BINS);
  const jitter = options.jitter ?? 0.02;

  for (let i = 0; i < BINS; i++) {
    // Deterministic pseudo-noise: a seeded sine keeps the tests repeatable while still
    // varying per bin and per frame, which is what defeats a whole-band peak.
    const wobble = Math.sin(i * 12.9898 + seed * 78.233) * jitter;
    bins[i] = Math.max(0, Math.min(1, options.noise + wobble)) * 255;
  }

  if (options.carrierBin !== undefined) {
    const level = options.noise + (options.carrierLevel ?? 0.2);
    bins[options.carrierBin] = Math.min(1, level) * 255;
  }

  if (toneOn && options.toneBin !== undefined) {
    const level = options.noise + (options.toneLevel ?? 0.3);
    bins[options.toneBin] = Math.min(1, level) * 255;
  }

  return bins;
}

/** Feeds a pulse train of the shape every Russian channel marker has. */
function feedBand(
  detector: MarkerDetector,
  options: BandOptions & {
    periodSec: number;
    toneSec: number;
    count: number;
    /** Frame interval. The detector must not care what this is. */
    frameMs?: number;
  },
): void {
  const step = options.frameMs ?? FRAME_MS;
  const totalMs = options.periodSec * 1000 * options.count;
  let seed = 0;

  for (let t = 0; t < totalMs; t += step) {
    const intoCycle = (t / 1000) % options.periodSec;
    let toneOn = intoCycle < options.toneSec;

    // One frame of dropout near the middle of the pulse.
    if (toneOn && options.dropouts) {
      const intoPulse = intoCycle;
      const gapAt = options.toneSec / 2;
      if (intoPulse >= gapAt && intoPulse < gapAt + step / 1000) toneOn = false;
    }

    detector.feed(t, frame(options, toneOn, seed++));
  }
}

group('MarkerDetector', () => {
  it('reports idle until it has enough frames to say anything', () => {
    const detector = new MarkerDetector();
    for (let i = 0; i < 5; i++) detector.feed(i * FRAME_MS, frame({ noise: 0.4 }, false, i));

    expect(detector.read().state).toBe('idle');
  });

  it('reports idle through the warm-up rather than judging the band early', () => {
    const detector = new MarkerDetector();
    // The baseline needs about eleven seconds to settle; before that any verdict would
    // be an artefact of wherever the marker happened to be on the first frame.
    for (let i = 0; i < 200; i++) detector.feed(i * FRAME_MS, frame({ noise: 0.5 }, false, i));

    expect(detector.read().state).toBe('idle');
  });

  it('reports absent on a band that is only noise', () => {
    const detector = new MarkerDetector();
    for (let i = 0; i < 400; i++) detector.feed(i * FRAME_MS, frame({ noise: 0.5 }, false, i));

    const detection = detector.read();
    expect(detection.state).toBe('absent');
    expect(detection.periodSec).toBeNull();
  });

  it("measures The Buzzer's 2.4 s period and 25 pulses a minute", () => {
    const detector = new MarkerDetector();
    feedBand(detector, {
      noise: 0.35,
      toneBin: 90,
      toneLevel: 0.35,
      periodSec: 2.4,
      toneSec: 1.2,
      count: 12,
    });

    const detection = detector.read();
    expect(detection.state).toBe('detected');
    expect(detection.periodSec).toBeCloseTo(2.4, 1);
    expect(Math.round(detection.perMinute!)).toBe(25);
    expect(detection.trackedBin).toBe(90);
  });

  it("measures The Pip's 1.2 s period and 50 pulses a minute", () => {
    const detector = new MarkerDetector();
    feedBand(detector, {
      noise: 0.35,
      toneBin: 140,
      toneLevel: 0.35,
      periodSec: 1.2,
      toneSec: 0.6,
      count: 24,
    });

    const detection = detector.read();
    expect(detection.state).toBe('detected');
    expect(detection.periodSec).toBeCloseTo(1.2, 1);
    // Within one pulse a minute of the published 50. The frame interval quantises the
    // edge times, and at 45 ms per frame a 1.2 s period cannot be resolved better than
    // that — the real app samples at a similar rate, so this error is the honest one.
    expect(detection.perMinute!).toBeGreaterThan(48.5);
    expect(detection.perMinute!).toBeLessThan(51.5);
  });

  /**
   * The regression case. A KiwiSDR in France on 4625 kHz delivered exactly this — a
   * loud band from the receiver's AGC with the buzz only modestly above it — and the
   * first implementation sat on "pulses present, measuring period…" for thirty seconds
   * while twelve pulses were plainly visible in the waterfall.
   */
  it("locks onto a marker in a real receiver's loud band", () => {
    const detector = new MarkerDetector();
    feedBand(detector, {
      noise: 0.75,
      jitter: 0.06,
      toneBin: 90,
      toneLevel: 0.15,
      periodSec: 2.4,
      toneSec: 1.2,
      count: 14,
    });

    const detection = detector.read();
    expect(detection.state).toBe('detected');
    expect(detection.periodSec).toBeCloseTo(2.4, 1);
    expect(detection.trackedBin).toBe(90);
  });

  /**
   * The second regression case. Every time constant used to be counted in frames, so
   * the warm-up took twelve seconds at 20 fps and over two minutes in a throttled tab
   * measured at 1.7 fps — where the detector simply never reported anything. The
   * cadence is not something the app controls; the timestamps are.
   */
  it.each([16, 45, 200])('reaches the same verdict at %i ms per frame', (frameMs) => {
    const detector = new MarkerDetector();
    feedBand(detector, {
      noise: 0.75,
      jitter: 0.06,
      toneBin: 90,
      toneLevel: 0.15,
      periodSec: 2.4,
      toneSec: 1.2,
      count: 16,
      frameMs,
    });

    const detection = detector.read();
    expect(detection.state).toBe('detected');
    // Edge times quantise to the frame interval, so a coarse rate costs accuracy — but
    // never the verdict.
    expect(detection.periodSec).toBeGreaterThan(2.1);
    expect(detection.periodSec).toBeLessThan(2.7);
  });

  /**
   * The third regression case, and the one the on-air test actually failed on. The
   * captured waterfall showed five textbook cycles at a 42 % duty cycle while the
   * detector reported 0.09 consistency, because each pulse carries brief dropouts and
   * every one of them re-armed the edge detector.
   */
  it('is not fooled by dropouts inside a pulse', () => {
    const detector = new MarkerDetector();
    feedBand(detector, {
      noise: 0.75,
      jitter: 0.06,
      toneBin: 90,
      toneLevel: 0.15,
      periodSec: 2.4,
      toneSec: 1.0,
      count: 16,
      dropouts: true,
    });

    const detection = detector.read();
    expect(detection.state).toBe('detected');
    expect(detection.periodSec).toBeCloseTo(2.4, 1);
    expect(detection.consistency).toBeGreaterThan(0.9);
  });

  it('ignores a steady carrier, however loud, and finds the pulsing bin instead', () => {
    const detector = new MarkerDetector();
    feedBand(detector, {
      noise: 0.4,
      carrierBin: 300,
      carrierLevel: 0.55,
      toneBin: 90,
      toneLevel: 0.2,
      periodSec: 2.4,
      toneSec: 1.2,
      count: 14,
    });

    const detection = detector.read();
    expect(detection.trackedBin).toBe(90);
    expect(detection.state).toBe('detected');
  });

  it('reports absent for a carrier with no pulse at all', () => {
    const detector = new MarkerDetector();
    for (let i = 0; i < 300; i++) {
      detector.feed(i * FRAME_MS, frame({ noise: 0.4, carrierBin: 300, carrierLevel: 0.5 }, false, i));
    }

    expect(detector.read().state).toBe('absent');
  });

  it('stays in searching while it has too few edges to take a median', () => {
    const detector = new MarkerDetector();
    // Long enough to clear the warm-up, short enough that only a couple of edges have
    // been timed.
    feedBand(detector, {
      noise: 0.35,
      toneBin: 90,
      toneLevel: 0.35,
      periodSec: 2.4,
      toneSec: 1.2,
      count: 7,
    });

    expect(detector.read().state).toBe('searching');
  });

  it('rejects a period longer than any channel marker uses', () => {
    const detector = new MarkerDetector();
    feedBand(detector, {
      noise: 0.35,
      toneBin: 90,
      toneLevel: 0.35,
      periodSec: 12,
      toneSec: 4,
      count: 6,
    });

    expect(detector.read().state).toBe('absent');
  });

  it('forgets everything on reset', () => {
    const detector = new MarkerDetector();
    feedBand(detector, {
      noise: 0.35,
      toneBin: 90,
      toneLevel: 0.35,
      periodSec: 2.4,
      toneSec: 1.2,
      count: 12,
    });
    expect(detector.read().state).toBe('detected');

    detector.reset();
    expect(detector.read().state).toBe('idle');
    expect(detector.read().trackedBin).toBeNull();
  });
});

group('matchesExpected', () => {
  it('accepts a measurement within a quarter of the published period', () => {
    expect(matchesExpected(2.38, 2.4)).toBe(true);
    // Just inside the tolerance rather than exactly on it: 25 % of 2.4 is not
    // representable, so the boundary itself is a floating-point coin toss and is not a
    // meaningful thing to pin.
    expect(matchesExpected(2.98, 2.4)).toBe(true);
    expect(matchesExpected(1.82, 2.4)).toBe(true);
  });

  it('rejects a measurement outside it', () => {
    expect(matchesExpected(3.1, 2.4)).toBe(false);
    expect(matchesExpected(1.2, 2.4)).toBe(false);
  });
});

group('describe', () => {
  const detected = (periodSec: number) => ({
    state: 'detected' as const,
    periodSec,
    perMinute: 60 / periodSec,
    consistency: 1,
    range: 0.8,
    trackedBin: 90,
  });

  it('says the measurement matches when it does', () => {
    expect(describe(detected(2.38), 2.4)).toBe(
      'marker detected, period 2.38 s (25/min) — matches the published 2.40 s',
    );
  });

  it('says both figures when the measurement disagrees', () => {
    expect(describe(detected(3.1), 2.4)).toBe(
      'periodic signal at 3.10 s (19/min), but the published period is 2.40 s',
    );
  });

  it('omits the comparison when no period is published', () => {
    expect(describe(detected(2.38), null)).toBe('marker detected, period 2.38 s (25/min)');
  });

  it('distinguishes an empty band from a signal it cannot lock', () => {
    const absent = describe(
      { state: 'absent', periodSec: null, perMinute: null, consistency: 0, range: 0.02, trackedBin: 90 },
      2.4,
    );
    const searching = describe(
      { state: 'searching', periodSec: 2.9, perMinute: 20, consistency: 0.5, range: 0.6, trackedBin: 90 },
      2.4,
    );

    expect(absent).toBe('no marker — band is noise, or the transmitter is off');
    expect(searching).toContain('irregular');
    expect(searching).not.toBe(absent);
  });
});
