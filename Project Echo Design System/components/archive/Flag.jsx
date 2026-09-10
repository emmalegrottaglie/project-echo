import React from 'react';

/**
 * A short uppercase word carrying a data caveat: disputed, not imported, never
 * confirmed. No meaning in this app is carried by colour alone, so the flag is always
 * a word.
 */
export function Flag({ tone = 'accent', children }) {
  const color = { accent: 'var(--accent)', dim: 'var(--dim)', danger: 'var(--danger)', ok: 'var(--ok)' }[tone];
  return (
    <span
      style={{
        display: 'inline-block',
        color,
        font: `var(--weight-medium) var(--text-label)/var(--leading-tight) var(--font-mono)`,
        letterSpacing: 'var(--tracking-label)',
        textTransform: 'uppercase',
      }}
    >
      {children}
    </span>
  );
}
