import React from 'react';

const THEMES = [
  { value: 'phosphor', label: 'phosphor', swatch: '#4ade80' },
  { value: 'amber', label: 'amber', swatch: '#fbbf24' },
  { value: 'midnight', label: 'midnight', swatch: '#38bdf8' },
  { value: 'nightvision', label: 'nightvision', swatch: '#f87171' },
];

/**
 * Theme control. Changing theme is instant and explicitly has no transition
 * (motion item 14): a 300 ms recolour of every surface is a full-page repaint and it
 * fights the waterfall.
 */
export function ThemePicker({ value = 'phosphor', onChange, style }) {
  return (
    <div role="radiogroup" aria-label="Theme" style={{ display: 'flex', gap: 'var(--space-1)', ...style }}>
      {THEMES.map((theme) => {
        const on = theme.value === value;
        return (
          <button
            key={theme.value}
            type="button"
            role="radio"
            aria-checked={on}
            aria-label={theme.label}
            onClick={() => onChange && onChange(theme.value)}
            style={{
              width: 'var(--touch-min)',
              height: 'var(--touch-min)',
              display: 'grid',
              placeItems: 'center',
              border: `var(--hairline-width) solid ${on ? 'var(--accent)' : 'transparent'}`,
              borderRadius: 'var(--radius-control)',
              background: 'transparent',
              cursor: 'pointer',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <span
              style={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                background: theme.swatch,
                boxShadow: on ? `0 0 8px ${theme.swatch}66` : 'none',
              }}
            />
          </button>
        );
      })}
    </div>
  );
}
