import React from 'react';

/**
 * Per-slot alert subscription. The desktop build used a glyph-sized ◉/○ button; on
 * mobile it becomes a 44px switch. Track colour is the one documented exception to the
 * transform-and-opacity-only rule: a track is never near the waterfall.
 */
export function AlertSwitch({ on = false, disabled = false, onChange, label = 'Alert before this window' }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange && onChange(!on)}
      style={{
        width: 'var(--touch-min)',
        height: 'var(--touch-min)',
        display: 'grid',
        placeItems: 'center',
        border: 0,
        background: 'transparent',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.45 : 1,
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <span
        style={{
          position: 'relative',
          width: 34,
          height: 20,
          borderRadius: 10,
          border: `var(--hairline-width) solid ${on ? 'var(--accent)' : 'var(--border)'}`,
          background: on ? 'var(--tint-accent-press)' : 'var(--panel)',
          transition: 'background-color var(--dur-fast) var(--ease-out), border-color var(--dur-fast) var(--ease-out)',
        }}
      >
        <span
          style={{
            position: 'absolute',
            top: 2,
            left: 2,
            width: 14,
            height: 14,
            borderRadius: '50%',
            background: on ? 'var(--accent)' : 'var(--dim)',
            transform: on ? 'translateX(14px)' : 'translateX(0)',
            transition: 'transform var(--dur-fast) var(--ease-out)',
          }}
        />
      </span>
    </button>
  );
}
