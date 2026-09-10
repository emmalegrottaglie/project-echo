import React from 'react';

/**
 * The one piece of live interpretation on the screen, and what makes the app usable by
 * someone who cannot see the spectrogram at all (MOBILE_UI_SPEC §5.5, §8).
 *
 * Four states. searching runs the only permitted loop while streaming: a 24px accent
 * bar crossing a 2px strip. detected fires its scale-in once, then holds still — this
 * is an instrument reporting a lock, not a game rewarding the player.
 */
const WORDING = {
  idle: { glyph: '\u00b7\u00b7\u00b7', text: 'listening\u2026' },
  searching: { glyph: '\u2248', text: 'pulses present, measuring period\u2026' },
  detected: { glyph: '\u25cf', text: 'marker detected' },
  absent: { glyph: '\u2014', text: 'no marker \u2014 band is noise, or the transmitter is off' },
};

export function DetectorStrip({ state = 'idle', periodSec, perMinute, expectedSec, consistency }) {
  const accentState = state === 'detected';
  const wording = WORDING[state] || WORDING.idle;

  let line = wording.text;
  if (state === 'detected' && periodSec) {
    const measured = `period ${periodSec.toFixed(2)} s (${Math.round(perMinute || 60 / periodSec)}/min)`;
    const matches = expectedSec != null && Math.abs(periodSec - expectedSec) <= expectedSec * 0.25;
    line = expectedSec == null
      ? `marker detected, ${measured}`
      : matches
        ? `marker detected, ${measured} \u2014 matches the published ${expectedSec.toFixed(2)} s`
        : `periodic signal at ${measured}, but the published period is ${expectedSec.toFixed(2)} s`;
  }
  if (state === 'searching' && periodSec) {
    line = `pulses present but irregular (${(consistency ?? 0).toFixed(2)} consistency)`;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        borderTop: 'var(--hairline-width) solid var(--border)',
        borderBottom: 'var(--hairline-width) solid var(--border)',
        background: 'var(--panel)',
      }}
    >
      <div style={{ position: 'relative', height: 2, overflow: 'hidden', background: 'var(--border)' }}>
        {state === 'searching' && (
          <span
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: 24,
              height: 2,
              background: 'var(--accent)',
              animation: 'echo-scan var(--dur-scan) linear infinite',
            }}
          />
        )}
        {state === 'detected' && <span style={{ position: 'absolute', inset: 0, background: 'var(--accent)' }} />}
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: 'var(--space-2)',
          padding: 'var(--space-3) var(--space-4)',
          color: accentState ? 'var(--accent)' : 'var(--dim)',
          font: `var(--text-body)/var(--leading-data) var(--font-mono)`,
          animation: accentState ? `echo-confirm var(--dur-deliberate) var(--ease-out) both` : undefined,
        }}
      >
        <span aria-hidden="true" style={{ opacity: 0.8 }}>{wording.glyph}</span>
        <span>{line}</span>
      </div>
      <style>{`
        @keyframes echo-scan { from { transform: translateX(-24px) } to { transform: translateX(calc(100vw + 24px)) } }
        @keyframes echo-confirm { from { opacity: 0; transform: scale(.96) } to { opacity: 1; transform: scale(1) } }
        @media (prefers-reduced-motion: reduce) {
          @keyframes echo-scan { from { transform: translateX(0) } to { transform: translateX(0) } }
          @keyframes echo-confirm { from { opacity: 0 } to { opacity: 1 } }
        }
      `}</style>
    </div>
  );
}
