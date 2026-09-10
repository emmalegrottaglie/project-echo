import React from 'react';

/**
 * Directory-load placeholder (motion item 13). Three rows, opacity 0.4→0.7, 900ms,
 * looping only while fetching — and audio is not streaming while the directory sheet
 * is open in the normal flow.
 */
export function Skeleton({ rows = 3 }) {
  return (
    <div aria-hidden="true" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--hairline-width)' }}>
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={index}
          style={{
            height: 56,
            borderBottom: 'var(--hairline-width) solid var(--border)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            gap: 'var(--space-2)',
          }}
        >
          <div style={{ width: '62%', height: 10, background: 'var(--border)', animation: 'echo-skeleton var(--dur-skeleton) var(--ease-inout) infinite' }} />
          <div style={{ width: '34%', height: 8, background: 'var(--border)', animation: 'echo-skeleton var(--dur-skeleton) var(--ease-inout) infinite' }} />
        </div>
      ))}
      <style>{`
        @keyframes echo-skeleton { 0%,100% { opacity: .4 } 50% { opacity: .7 } }
        @media (prefers-reduced-motion: reduce) {
          @keyframes echo-skeleton { 0%,100% { opacity: .55 } 50% { opacity: .55 } }
        }
      `}</style>
    </div>
  );
}
