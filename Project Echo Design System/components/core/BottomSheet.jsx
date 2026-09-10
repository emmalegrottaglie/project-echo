import React from 'react';

/**
 * Bottom sheet: receiver picker, station picker, directory browser (MOBILE_UI_SPEC §4.4).
 * 90% max height, drag handle, swipe-to-dismiss, scrim in --overlay — the scrim is
 * deliberately translucent so the waterfall stays visible behind it.
 */
export function BottomSheet({ open = true, title, note, onDismiss, children, height = '90%' }) {
  if (!open) return null;

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 20, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
      <div
        onClick={onDismiss}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'var(--overlay)',
          animation: 'echo-fade-in var(--dur-base) var(--ease-out) both',
        }}
      />
      <section
        style={{
          position: 'relative',
          maxHeight: height,
          display: 'flex',
          flexDirection: 'column',
          borderTop: 'var(--hairline-width) solid var(--border)',
          borderRadius: 'var(--radius-sheet) var(--radius-sheet) 0 0',
          background: 'var(--surface-elevated)',
          animation: 'echo-sheet-in var(--dur-slow) var(--ease-out) both',
          paddingBottom: 'var(--safe-bottom)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-2) 0 var(--space-1)' }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--border)' }} />
        </div>
        {title && (
          <header style={{ padding: 'var(--space-2) var(--space-4) var(--space-3)' }}>
            <h2
              style={{
                margin: 0,
                color: 'var(--accent)',
                font: `var(--weight-semibold) var(--text-title)/var(--leading-tight) var(--font-mono)`,
                letterSpacing: 'var(--tracking-title)',
              }}
            >
              {title}
            </h2>
            {note && (
              <p style={{ margin: 'var(--space-2) 0 0', color: 'var(--dim)', font: `var(--text-label)/var(--leading-body) var(--font-sans)` }}>
                {note}
              </p>
            )}
          </header>
        )}
        <div style={{ overflowY: 'auto', padding: '0 var(--space-4) var(--space-4)' }}>{children}</div>
      </section>
      <style>{`
        @keyframes echo-fade-in { from { opacity: 0 } to { opacity: 1 } }
        @keyframes echo-sheet-in { from { transform: translateY(100%) } to { transform: translateY(0) } }
        @media (prefers-reduced-motion: reduce) {
          @keyframes echo-sheet-in { from { opacity: 0 } to { opacity: 1 } }
        }
      `}</style>
    </div>
  );
}
