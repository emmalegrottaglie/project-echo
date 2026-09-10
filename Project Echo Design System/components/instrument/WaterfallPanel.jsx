import React from 'react';

/**
 * The spectrogram viewport: 320 rows, full bleed, square corners, a kHz offset scale
 * along one edge (0–3 kHz of the SSB passband), newest row at the bottom.
 *
 * In the real app this is a canvas of height 2×320 translated under a clipping
 * viewport at 22 fps. Here it renders a static representation for design work: the
 * mock draws bands from the same inferno ramp the app uses. Nothing in a design may
 * require re-laying out or repainting this region while it runs.
 */
export function WaterfallPanel({ rows = 320, mock = 'detected', frozen = false, periodSec = 2.4 }) {
  const bands = [];
  if (mock !== 'blank') {
    const count = mock === 'noise' ? 44 : 26;
    for (let i = 0; i < count; i += 1) {
      const strong = mock === 'detected' && i % 3 === 0;
      bands.push({
        top: (i / count) * 100,
        height: strong ? 1.6 : 0.7,
        left: mock === 'noise' ? 8 + ((i * 37) % 80) : 46 + ((i * 13) % 7),
        width: strong ? 8 : 4,
        opacity: strong ? 1 : 0.55,
      });
    }
  }

  return (
    <div
      style={{
        position: 'relative',
        height: rows,
        overflow: 'hidden',
        borderRadius: 'var(--radius-instrument)',
        background: 'var(--wf-ground)',
        animation: 'echo-waterfall-reveal var(--dur-base) var(--ease-out) both',
      }}
    >
      {/* Noise floor. */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, var(--wf-01) 0%, var(--wf-00) 30%, var(--wf-01) 55%, var(--wf-00) 100%)', opacity: 0.75 }} />
      {bands.map((band, index) => (
        <div
          key={index}
          style={{
            position: 'absolute',
            top: `${band.top}%`,
            left: `${band.left}%`,
            width: `${band.width}%`,
            height: `${band.height}%`,
            background: `linear-gradient(90deg, var(--wf-04), var(--wf-07), var(--wf-04))`,
            opacity: band.opacity,
          }}
        />
      ))}

      {/* Frequency scale, kHz offset from the passband. */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: 0,
          width: 34,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 'var(--space-1) 0',
          background: 'linear-gradient(90deg, rgba(0,0,0,.72), transparent)',
          color: 'var(--dim)',
          font: `var(--text-label)/var(--leading-tight) var(--font-mono)`,
        }}
      >
        {['3k', '2k', '1k', '0'].map((label) => (
          <span key={label} style={{ paddingLeft: 'var(--space-1)' }}>{label}</span>
        ))}
      </div>

      {frozen && (
        <div style={{ position: 'absolute', top: 'var(--space-2)', right: 'var(--space-2)', padding: '2px var(--space-2)', border: 'var(--hairline-width) solid var(--accent)', color: 'var(--accent)', font: `var(--text-label)/1.6 var(--font-mono)`, letterSpacing: 'var(--tracking-label)', textTransform: 'uppercase', background: 'rgba(0,0,0,.6)' }}>
          frozen
        </div>
      )}
      {mock === 'blank' && (
        <p style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', margin: 0, color: 'var(--dim)', font: `var(--text-body)/var(--leading-body) var(--font-mono)` }}>
          no signal yet
        </p>
      )}
      <style>{`@keyframes echo-waterfall-reveal { from { opacity: 0 } to { opacity: 1 } }`}</style>
    </div>
  );
}
