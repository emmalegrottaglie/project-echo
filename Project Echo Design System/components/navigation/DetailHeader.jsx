import React from 'react';

/** Header for the pushed station detail view: back affordance, designator, name. */
export function DetailHeader({ designator, name, tier, onBack }) {
  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-3)',
        padding: 'var(--space-2) var(--space-4) var(--space-2) var(--space-2)',
        borderBottom: 'var(--hairline-width) solid var(--border)',
        background: 'var(--bg)',
      }}
    >
      <button
        type="button"
        onClick={onBack}
        aria-label="Back to archive"
        style={{
          width: 'var(--touch-min)',
          height: 'var(--touch-min)',
          display: 'grid',
          placeItems: 'center',
          border: 0,
          background: 'transparent',
          color: 'var(--dim)',
          font: `var(--text-display)/1 var(--font-mono)`,
          cursor: 'pointer',
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        ‹
      </button>
      <span style={{ minWidth: 0 }}>
        <span style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'baseline' }}>
          <span style={{ color: 'var(--accent)', font: `var(--weight-semibold) var(--text-title)/var(--leading-tight) var(--font-mono)`, whiteSpace: 'nowrap' }}>
            {designator}
          </span>
          <span style={{ color: 'var(--fg)', font: `var(--text-title)/var(--leading-tight) var(--font-sans)`, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {name}
          </span>
        </span>
        {tier && (
          <span style={{ display: 'block', color: 'var(--dim)', font: `var(--text-label)/1.4 var(--font-sans)`, letterSpacing: 'var(--tracking-label)', textTransform: 'uppercase' }}>
            {tier}
          </span>
        )}
      </span>
    </header>
  );
}
