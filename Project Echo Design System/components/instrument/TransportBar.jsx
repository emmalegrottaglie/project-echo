import React from 'react';
import { Button } from '../core/Button.jsx';

/**
 * Fixed above the tab bar so it never scrolls away: the first tap on Connect is what
 * creates the audio graph, so this control is load-bearing and must be reachable
 * without scrolling on the smallest target device.
 *
 * Connect and Stop are one control that swaps role. It must not resize.
 */
export function TransportBar({ running = false, connecting = false, onConnect, onStop, onSynthetic, showSynthetic = true }) {
  const label = connecting ? 'Connecting…' : running ? 'Stop' : 'Connect';

  return (
    <div
      style={{
        display: 'flex',
        gap: 'var(--space-2)',
        padding: 'var(--space-2) var(--space-4)',
        paddingBottom: 'calc(var(--space-2) + var(--safe-bottom))',
        borderTop: 'var(--hairline-width) solid var(--border)',
        background: 'var(--panel)',
      }}
    >
      <Button
        variant="primary"
        size="lg"
        full
        onClick={running ? onStop : onConnect}
        disabled={connecting}
        style={{ flex: 1, transition: 'opacity var(--dur-fast) var(--ease-inout)' }}
      >
        {label}
      </Button>
      {showSynthetic && (
        <Button size="lg" onClick={onSynthetic} style={{ flex: '0 0 auto', width: 132 }}>
          Synthetic
        </Button>
      )}
    </div>
  );
}
