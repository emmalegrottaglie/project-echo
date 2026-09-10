import React from 'react';

/**
 * The honest header block. Two facts, always stated: how much of the data is actually
 * imported, and what the notification permission can and cannot do.
 *
 * Alerts are per-browser and only fire while a tab is open — there is no service
 * worker, because the app must be served over plain http. "granted" says so; "denied"
 * says it is not recoverable in-app rather than offering a button that does nothing.
 */
const PERMISSION_COPY = {
  default: 'Enable notifications to be reminded before a window opens.',
  granted: 'Alerts fire 10 minutes ahead, while a tab is open. There is no server, so a closed browser means no alert.',
  denied: 'Notifications are blocked for this site. Alerts will not fire until that is changed in browser settings.',
  unsupported: 'This browser has no Notification API, so alerts cannot fire here.',
};

export function CoverageNote({ coverage, permission = 'default', action }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', padding: 'var(--space-3) var(--space-4)', borderBottom: 'var(--hairline-width) solid var(--border)' }}>
      {coverage && (
        <p style={{ margin: 0, color: 'var(--fg)', font: `var(--text-body)/var(--leading-body) var(--font-sans)`, maxWidth: '60ch', textWrap: 'pretty' }}>
          {coverage}
        </p>
      )}
      <p style={{ margin: 0, color: permission === 'denied' ? 'var(--danger)' : 'var(--dim)', font: `var(--text-label)/var(--leading-body) var(--font-sans)`, maxWidth: '60ch', textWrap: 'pretty' }}>
        {PERMISSION_COPY[permission]}
      </p>
      {action}
    </div>
  );
}
