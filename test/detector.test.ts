import { describe as group, expect, it } from 'vitest';
import { describe, matchesExpected, MarkerDetector } from '../src/detector';

/**
 * The detector is the app's one piece of interpretation: it decides whether a marker
 * is on the air and what its period is. Everything else on the live screen is a
 * rendering of what this returns, so its thresholds are worth pinning.
 */

/** Feeds a clean on/off pulse train, the shape every Russian channel marker has. */
function feedPulses(
  detector: MarkerDetector,
  { periodSec, toneSec, count, level = 0.9, floor = 0.05, stepMs = 45 }: {
    periodSec: number;
    toneSec: number;
    count: number;
    level?: number;
    floor?: number;
    stepMs?: number;
  },
): void {
  const totalMs = periodSec * 1000 * count;
  for (let t = 0; t < totalMs; t += stepMs) {
    const withinPulse = (t / 1000) % periodSec < toneSec;
    detector.feed(t, withinPulse ? level : floor);
  }
}

group('MarkerDetector', () => {
  it('reports idle until it has enough samples to say anything', () => {
    const detector = new MarkerDetector();
    for (let i = 0; i < 5; i++) detector.feed(i * 45, 0.5);

    expect(detector.read().state).toBe('idle');
  });

  it('reports absent when the band has no dynamic range', () => {
    const detector = new MarkerDetector();
    // Flat noise: a level that never swings cannot contain a pulse, and finding a
    // period in it would be finding a pattern in hiss.
    for (let i = 0; i < 60; i++) detector.feed(i * 45, 0.4 + (i % 2) * 0.01);

    const detection = detector.read();
    expect(detection.state).toBe('absent');
    expect(detection.periodSec).toBeNull();
  });

  it("measures The Buzzer's 2.4 s period and 25 pulses a minute", () => {
    const detector = new MarkerDetector();
    feedPulses(detector, { periodSec: 2.4, toneSec: 1.2, count: 8 });

    const detection = detector.read();
    expect(detection.state).toBe('detected');
    expect(detection.periodSec).toBeCloseTo(2.4, 1);
    expect(Math.round(detection.perMinute!)).toBe(25);
    expect(detection.consistency).toBe(1);
  });

  it("measures The Pip's 1.2 s period and 50 pulses a minute", () => {
    const detector = new MarkerDetector();
    feedPulses(detector, { periodSec: 1.2, toneSec: 0.6, count: 12, stepMs: 30 });

    const detection = detector.read();
    expect(detection.state).toBe('detected');
    expect(detection.periodSec).toBeCloseTo(1.2, 1);
    expect(Math.round(detection.perMinute!)).toBe(50);
  });

  it('stays in searching while it has too few edges to take a median', () => {
    const detector = new MarkerDetector();
    feedPulses(detector, { periodSec: 2.4, toneSec: 1.2, count: 2 });

    expect(detector.read().state).toBe('searching');
  });

  it('rejects a period longer than any channel marker uses', () => {
    const detector = new MarkerDetector();
    feedPulses(detector, { periodSec: 12, toneSec: 4, count: 6, stepMs: 200 });

    expect(detector.read().state).toBe('absent');
  });

  it('forgets everything on reset', () => {
    const detector = new MarkerDetector();
    feedPulses(detector, { periodSec: 2.4, toneSec: 1.2, count: 8 });
    expect(detector.read().state).toBe('detected');

    detector.reset();
    expect(detector.read().state).toBe('idle');
  });
});

group('matchesExpected', () => {
  it('accepts a measurement within a quarter of the published period', () => {
    expect(matchesExpected(2.38, 2.4)).toBe(true);
    // Just inside the tolerance rather than exactly on it: 25 % of 2.4 is not
    // representable, so the boundary itself is a floating-point coin toss and is not
    // a meaningful thing to pin.
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
      { state: 'absent', periodSec: null, perMinute: null, consistency: 0, range: 0.02 },
      2.4,
    );
    const searching = describe(
      { state: 'searching', periodSec: 2.9, perMinute: 20, consistency: 0.5, range: 0.6 },
      2.4,
    );

    expect(absent).toBe('no marker — band is noise, or the transmitter is off');
    expect(searching).toContain('irregular');
    expect(searching).not.toBe(absent);
  });
});
