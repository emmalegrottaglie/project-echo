import React from 'react';

/**
 * The app's status line: an ARIA live region that crossfades on change (motion item
 * 11) because movement would fight the announcement. It is where "connected but no
 * audio reached the analyser" gets said in plain words.
 */
export function StatusLine({ message = 'idle', tone = 'neutral', action }) {
  const rail = { neutral: 'var(--dim)', live: 'var(--accent)', danger: 'var(--danger)', ok: 'var(--ok)' }[tone];

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 'var(--space-3)',
        padding: 'var(--space-2) var(--space-3)',
        borderLeft: `2px solid ${rail}`,
        background: 'var(--panel)',
        color: tone === 'danger' ? 'var(--danger)' : 'var(--fg)',
        font: `var(--text-body)/var(--leading-body) var(--font-mono)`,
        transition: 'opacity var(--dur-fast) var(--ease-inout)',
      }}
    >
      <span>{message}</span>
      {action}
    </div>
  );
}
