import React from 'react';

/** Sticky section header grouping the archive by tier when no filter is applied. */
export function TierHeader({ label, count }) {
  return (
    <div
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 1,
        display: 'flex',
        justifyContent: 'space-between',
        gap: 'var(--space-2)',
        padding: 'var(--space-2) var(--space-4)',
        borderBottom: 'var(--hairline-width) solid var(--border)',
        background: 'var(--panel)',
        color: 'var(--dim)',
        font: `var(--weight-medium) var(--text-label)/var(--leading-tight) var(--font-mono)`,
        letterSpacing: 'var(--tracking-label)',
        textTransform: 'uppercase',
      }}
    >
      <span>{label}</span>
      {count != null && <span>{count}</span>}
    </div>
  );
}
