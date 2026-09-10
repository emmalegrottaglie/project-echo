import React from 'react';
import { ThemePicker } from '../core/ThemePicker.jsx';

/**
 * On phone the header keeps the app name and the theme control only — navigation has
 * moved to the tab bar. The name is the wordmark: there is no logo in the source.
 */
export function AppHeader({ title = 'Project Echo', theme = 'phosphor', onThemeChange }) {
  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 'var(--space-3)',
        padding: 'var(--space-2) var(--space-3) var(--space-2) var(--space-4)',
        borderBottom: 'var(--hairline-width) solid var(--border)',
        background: 'var(--bg)',
      }}
    >
      <h1
        style={{
          margin: 0,
          color: 'var(--accent)',
          font: `var(--weight-semibold) var(--text-title)/var(--leading-tight) var(--font-mono)`,
          letterSpacing: 'var(--tracking-brand)',
          textTransform: 'uppercase',
        }}
      >
        {title}
      </h1>
      <ThemePicker value={theme} onChange={onThemeChange} />
    </header>
  );
}
