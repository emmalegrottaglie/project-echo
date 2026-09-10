import React from 'react';
import { Flag } from './Flag.jsx';

/**
 * Frequency provenance. No frequency is stored as a bare constant: each row carries
 * its own source and confirmation date, and a disputed flag where sources conflict.
 * Disputed rows get an 8% accent wash plus the word — colour never carries it alone.
 */
export function ProvenanceTable({ rows }) {
  const cell = { padding: 'var(--space-2) var(--space-2) var(--space-2) 0', borderBottom: 'var(--hairline-width) solid var(--border)', verticalAlign: 'top' };
  const head = {
    ...cell,
    color: 'var(--dim)',
    font: `var(--weight-medium) var(--text-label)/var(--leading-tight) var(--font-mono)`,
    letterSpacing: 'var(--tracking-label)',
    textTransform: 'uppercase',
    textAlign: 'left',
  };

  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', font: `var(--text-body)/var(--leading-data) var(--font-mono)`, color: 'var(--fg)' }}>
      <thead>
        <tr>
          <th style={head}>kHz</th>
          <th style={head}>Mode</th>
          <th style={head}>When</th>
          <th style={head}>Last confirmed</th>
          <th style={head}>Source</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row, index) => (
          <tr key={index} style={row.disputed ? { background: 'var(--tint-accent-weak)' } : undefined}>
            <td style={cell}>{row.khz}</td>
            <td style={cell}>{row.mode}</td>
            <td style={cell}>{row.timeOfDay || '—'}</td>
            <td style={cell}>{row.lastConfirmed}</td>
            <td style={cell}>
              <a href={row.sourceUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)' }}>source</a>
              {row.disputed && <> <Flag>disputed</Flag></>}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
