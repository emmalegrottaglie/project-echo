import React from 'react';

/** The archive's tier filter (MOBILE_UI_SPEC §4.3): All / Live / Scheduled / Historical. */
export function SegmentedControl({ options, value, onChange, style }) {
  return (
    <div
      role="tablist"
      style={{
        display: 'grid',
        gridAutoFlow: 'column',
        gridAutoColumns: '1fr',
        gap: 'var(--hairline-width)',
        padding: 'var(--hairline-width)',
        border: 'var(--hairline-width) solid var(--border)',
        borderRadius: 'var(--radius-control)',
        background: 'var(--panel)',
        ...style,
      }}
    >
      {options.map((option) => {
        const on = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => onChange && onChange(option.value)}
            style={{
              minHeight: 36,
              padding: '0 var(--space-2)',
              border: 0,
              borderRadius: 2,
              background: on ? 'var(--tint-accent-weak)' : 'transparent',
              color: on ? 'var(--accent)' : 'var(--dim)',
              font: `var(--weight-medium) var(--text-label)/var(--leading-tight) var(--font-mono)`,
              letterSpacing: 'var(--tracking-label)',
              textTransform: 'uppercase',
              cursor: 'pointer',
              transition: 'color var(--dur-fast) var(--ease-out)',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
