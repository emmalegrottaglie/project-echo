import React from 'react';

/**
 * The live-tier dot. Its period is the station's real marker period — 2.4 s for The
 * Buzzer, 1.2 s for The Pip — taken from station data, not a fixed house value. The
 * dot beats at the rate the transmitter is.
 *
 * Opacity only. Scaling a 6px dot alongside a 22fps waterfall is visible jank on
 * mid-range Android.
 */
export function LivePulse({ periodSec = 2.4, size = 6, color = 'var(--accent)', title }) {
  return (
    <span
      title={title}
      style={{
        display: 'inline-block',
        width: size,
        height: size,
        borderRadius: '50%',
        background: color,
        animation: `echo-pulse ${periodSec}s var(--ease-inout) infinite`,
        flex: '0 0 auto',
      }}
    >
      <style>{`
        @keyframes echo-pulse { 0%,100% { opacity: 1 } 50% { opacity: .25 } }
        @media (prefers-reduced-motion: reduce) {
          @keyframes echo-pulse { 0%,100% { opacity: 1 } 50% { opacity: 1 } }
        }
      `}</style>
    </span>
  );
}
