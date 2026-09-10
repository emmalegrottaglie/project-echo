import React from 'react';
import { AlertSwitch } from './AlertSwitch.jsx';

/**
 * One upcoming transmission window. The countdown is the row's emphasis, monospace,
 * and turns accent under an hour. It changes on a timer, so it never animates on the
 * tick — only on crossing 1 h, 10 min and 1 min.
 */
export function ScheduleRow({ designator, name, utc, local, countdown, khz, note, urgent = false, alertOn = false, alertDisabled = false, onToggleAlert }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'var(--touch-min) 1fr auto',
        gap: '0 var(--space-3)',
        alignItems: 'center',
        padding: 'var(--space-2) var(--space-4) var(--space-2) var(--space-2)',
        borderBottom: 'var(--hairline-width) solid var(--border)',
      }}
    >
      <AlertSwitch on={alertOn} disabled={alertDisabled} onChange={onToggleAlert} />

      <div style={{ minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-2)' }}>
          <span style={{ color: 'var(--accent)', font: `var(--weight-medium) var(--text-body)/var(--leading-data) var(--font-mono)`, whiteSpace: 'nowrap' }}>
            {designator}
          </span>
          <span style={{ color: 'var(--fg)', font: `var(--text-body)/var(--leading-data) var(--font-sans)`, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {name}
          </span>
        </div>
        <div style={{ color: 'var(--dim)', font: `var(--text-label)/var(--leading-body) var(--font-mono)` }}>
          {utc} · {local} · {khz ? `${khz} kHz` : '—'}
        </div>
        {note && (
          <div style={{ marginTop: 2, color: 'var(--dim)', font: `var(--text-label)/var(--leading-body) var(--font-sans)`, textWrap: 'pretty' }}>
            {note}
          </div>
        )}
      </div>

      <span
        style={{
          color: urgent ? 'var(--accent)' : 'var(--fg)',
          font: `var(--weight-medium) var(--text-body)/var(--leading-data) var(--font-mono)`,
          whiteSpace: 'nowrap',
          alignSelf: 'start',
          paddingTop: 2,
        }}
      >
        {countdown}
      </span>
    </div>
  );
}
