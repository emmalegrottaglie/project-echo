import React from 'react';

/**
 * The detail view's definition list: classification, operator, dated status, marker,
 * aliases. Uppercase 12px labels against mono values.
 */
export function DetailList({ items }) {
  return (
    <dl
      style={{
        display: 'grid',
        gridTemplateColumns: 'max-content 1fr',
        gap: 'var(--space-2) var(--space-4)',
        margin: 0,
      }}
    >
      {items.map((item) => (
        <React.Fragment key={item.label}>
          <dt
            style={{
              color: 'var(--dim)',
              font: `var(--text-label)/var(--leading-body) var(--font-sans)`,
              letterSpacing: 'var(--tracking-label)',
              textTransform: 'uppercase',
            }}
          >
            {item.label}
          </dt>
          <dd style={{ margin: 0, color: 'var(--fg)', font: `var(--text-body)/var(--leading-body) var(--font-mono)` }}>
            {item.value}
          </dd>
        </React.Fragment>
      ))}
    </dl>
  );
}
