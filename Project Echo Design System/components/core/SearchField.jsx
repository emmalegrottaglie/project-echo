import React from 'react';

/** Sticky search for the archive. Placeholder copy is the app's: sentence case, no period. */
export function SearchField({ value, onChange, placeholder = 'Search designator, name or operator', style }) {
  return (
    <input
      type="search"
      value={value}
      placeholder={placeholder}
      onChange={(event) => onChange && onChange(event.target.value)}
      style={{
        width: '100%',
        minHeight: 'var(--touch-min)',
        padding: '0 var(--space-3)',
        border: 'var(--hairline-width) solid var(--border)',
        borderRadius: 'var(--radius-control)',
        background: 'var(--panel)',
        color: 'var(--fg)',
        font: `var(--weight-regular) var(--text-body)/var(--leading-tight) var(--font-mono)`,
        outlineOffset: 2,
        ...style,
      }}
    />
  );
}
