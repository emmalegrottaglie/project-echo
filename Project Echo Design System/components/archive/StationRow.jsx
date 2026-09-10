import React from 'react';
import { LivePulse } from '../instrument/LivePulse.jsx';

/**
 * One of 141 rows. Designator, name, operator. Live-tier rows carry the pulse at the
 * station's own marker period. Press feedback is opacity 0.7 on the row ground with no
 * exit animation and no ripple.
 */
export function StationRow({ designator, name, operator, tier = 'historical', periodSec, disputed = false, onOpen }) {
  const [pressed, setPressed] = React.useState(false);

  return (
    <button
      type="button"
      onClick={onOpen}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      style={{
        display: 'grid',
        gridTemplateColumns: '4.5rem 1fr auto',
        gridTemplateRows: 'auto auto',
        gap: '0 var(--space-2)',
        width: '100%',
        minHeight: 'var(--touch-min)',
        padding: 'var(--space-2) var(--space-4)',
        border: 0,
        borderBottom: 'var(--hairline-width) solid var(--border)',
        borderRadius: 0,
        background: 'transparent',
        textAlign: 'left',
        cursor: 'pointer',
        opacity: pressed ? 0.7 : 1,
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <span
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-2)',
          gridRow: 'span 2',
          color: 'var(--accent)',
          font: `var(--weight-medium) var(--text-body)/var(--leading-data) var(--font-mono)`,
          whiteSpace: 'nowrap',
        }}
      >
        {designator}
        {tier === 'live' && <LivePulse periodSec={periodSec ?? 2.4} title="live marker" />}
      </span>
      <span style={{ color: 'var(--fg)', font: `var(--text-body)/var(--leading-data) var(--font-sans)` }}>{name}</span>
      <span style={{ color: 'var(--dim)', font: `var(--text-label)/var(--leading-tight) var(--font-mono)`, letterSpacing: 'var(--tracking-label)', textTransform: 'uppercase', alignSelf: 'center' }}>
        {disputed ? 'disputed' : ''}
      </span>
      <span style={{ gridColumn: 2, color: 'var(--dim)', font: `var(--text-label)/var(--leading-body) var(--font-sans)` }}>{operator}</span>
    </button>
  );
}
