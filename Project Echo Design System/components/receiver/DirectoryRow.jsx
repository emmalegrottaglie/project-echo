import React from 'react';

/**
 * One public receiver from the proxied directory: location, free channels as 3/7, and
 * reported SNR. Sorted best-SNR first — a receiver with a free channel and a high SNR
 * is the one most likely to actually hear the marker.
 *
 * The upstream list returns 776 receivers for 4625 kHz. Never render them all: top 50
 * by SNR, a search field, and a "showing 50 of 776" line.
 */
export function DirectoryRow({ location, users, usersMax, snr, grid, selected = false, onAdopt }) {
  return (
    <button
      type="button"
      onClick={onAdopt}
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr auto auto',
        alignItems: 'center',
        gap: 'var(--space-3)',
        width: '100%',
        minHeight: 'var(--touch-min)',
        padding: 'var(--space-2) 0',
        border: 0,
        borderBottom: 'var(--hairline-width) solid var(--border)',
        background: selected ? 'var(--tint-accent-weak)' : 'transparent',
        textAlign: 'left',
        cursor: 'pointer',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <span style={{ minWidth: 0 }}>
        <span style={{ display: 'block', color: 'var(--fg)', font: `var(--text-body)/var(--leading-data) var(--font-sans)`, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {location}
        </span>
        {grid && (
          <span style={{ display: 'block', color: 'var(--dim)', font: `var(--text-label)/var(--leading-tight) var(--font-mono)` }}>{grid}</span>
        )}
      </span>
      <span style={{ color: users != null && usersMax != null && users >= usersMax ? 'var(--danger)' : 'var(--dim)', font: `var(--text-label)/var(--leading-tight) var(--font-mono)` }}>
        {users != null && usersMax != null ? `${users}/${usersMax}` : '—'}
      </span>
      <span style={{ minWidth: 62, textAlign: 'right', color: 'var(--accent)', font: `var(--text-body)/var(--leading-tight) var(--font-mono)` }}>
        {snr != null ? `SNR ${snr}` : '—'}
      </span>
    </button>
  );
}
