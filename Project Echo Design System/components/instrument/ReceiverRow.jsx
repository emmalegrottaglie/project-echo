import React from 'react';
import { LivePulse } from './LivePulse.jsx';

/**
 * One truncating line: the selected receiver or the tuned station, with a chevron
 * opening its sheet. Used twice at the top of the live view.
 */
export function ReceiverRow({ label, value, meta, live = false, periodSec = 2.4, flag, onOpen }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr auto',
        alignItems: 'center',
        gap: 'var(--space-3)',
        width: '100%',
        minHeight: 'var(--touch-min)',
        padding: 'var(--space-2) var(--space-4)',
        border: 0,
        borderBottom: 'var(--hairline-width) solid var(--border)',
        background: 'transparent',
        textAlign: 'left',
        cursor: 'pointer',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <span style={{ minWidth: 0 }}>
        <span
          style={{
            display: 'block',
            color: 'var(--dim)',
            font: `var(--text-label)/var(--leading-tight) var(--font-sans)`,
            letterSpacing: 'var(--tracking-label)',
            textTransform: 'uppercase',
          }}
        >
          {label}
        </span>
        <span
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            marginTop: 2,
            color: 'var(--fg)',
            font: `var(--text-body)/var(--leading-data) var(--font-mono)`,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {live && <LivePulse periodSec={periodSec} size={8} />}
          {value}
          {meta && <span style={{ color: 'var(--dim)' }}>{meta}</span>}
          {flag}
        </span>
      </span>
      <span aria-hidden="true" style={{ color: 'var(--dim)', font: `var(--text-title)/1 var(--font-mono)` }}>›</span>
    </button>
  );
}
