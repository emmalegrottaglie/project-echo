import React from 'react';

/**
 * An honest gap. 112 of 141 stations have sourced identity and status but no imported
 * detail, several views have no data yet, and three features vanish without the
 * server. All of those read as a stated gap with a route onward, never as a broken
 * page and never as an empty table.
 */
export function GapNotice({ title, children, links = [] }) {
  return (
    <section
      style={{
        padding: 'var(--space-4)',
        border: 'var(--hairline-width) solid var(--border)',
        borderRadius: 'var(--radius-control)',
        background: 'var(--panel)',
      }}
    >
      {title && (
        <h4
          style={{
            margin: '0 0 var(--space-2)',
            color: 'var(--dim)',
            font: `var(--weight-medium) var(--text-label)/var(--leading-tight) var(--font-mono)`,
            letterSpacing: 'var(--tracking-label)',
            textTransform: 'uppercase',
          }}
        >
          {title}
        </h4>
      )}
      <p style={{ margin: 0, color: 'var(--fg)', font: `var(--text-body)/var(--leading-body) var(--font-sans)`, maxWidth: '60ch', textWrap: 'pretty' }}>
        {children}
      </p>
      {links.length > 0 && (
        <ul style={{ margin: 'var(--space-3) 0 0', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          {links.map((link) => (
            <li key={link.url}>
              <a href={link.url} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)', font: `var(--text-body)/var(--leading-body) var(--font-mono)` }}>
                {link.label}
              </a>
              {link.description && (
                <span style={{ display: 'block', color: 'var(--dim)', font: `var(--text-label)/var(--leading-body) var(--font-sans)` }}>{link.description}</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
