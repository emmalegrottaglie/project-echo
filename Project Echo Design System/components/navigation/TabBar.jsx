import React from 'react';

/**
 * Bottom tab bar, three peers: Live, Schedule, Archive.
 *
 * Labels only, no icons — the source ships no icon set and its whole glyph vocabulary
 * is unicode in the mono face. Tabs are peers, not a stack, so switching fades and
 * lifts 8px; it never slides horizontally.
 */
const TABS = [
  { value: 'live', label: 'Live' },
  { value: 'schedule', label: 'Schedule' },
  { value: 'archive', label: 'Archive' },
];

export function TabBar({ value = 'live', onChange, tabs = TABS }) {
  return (
    <nav
      style={{
        display: 'grid',
        gridAutoFlow: 'column',
        gridAutoColumns: '1fr',
        borderTop: 'var(--hairline-width) solid var(--border)',
        background: 'var(--panel)',
        paddingBottom: 'var(--safe-bottom)',
      }}
    >
      {tabs.map((tab) => {
        const on = tab.value === value;
        return (
          <button
            key={tab.value}
            type="button"
            aria-current={on ? 'page' : undefined}
            onClick={() => onChange && onChange(tab.value)}
            style={{
              position: 'relative',
              minHeight: 'var(--tabbar-height)',
              border: 0,
              background: 'transparent',
              color: on ? 'var(--accent)' : 'var(--dim)',
              font: `var(--weight-medium) var(--text-label)/var(--leading-tight) var(--font-mono)`,
              letterSpacing: 'var(--tracking-label)',
              textTransform: 'uppercase',
              cursor: 'pointer',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <span
              aria-hidden="true"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 2,
                background: on ? 'var(--accent)' : 'transparent',
                boxShadow: on ? 'var(--glow-accent)' : 'none',
              }}
            />
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
}
