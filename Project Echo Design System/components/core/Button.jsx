import React from 'react';

/**
 * The app's one button. Primary and secondary are the transport controls from
 * MOBILE_UI_SPEC §4.1.5; ghost is the header/inline variant.
 *
 * The transport control must not resize when it swaps role (motion item 8), so every
 * variant keeps the same box and only the label crossfades.
 */
export function Button({
  variant = 'secondary',
  size = 'md',
  disabled = false,
  full = false,
  type = 'button',
  onClick,
  children,
  style,
  ...rest
}) {
  const pad = size === 'lg' ? '0 var(--space-4)' : '0 var(--space-3)';
  const height = size === 'lg' ? 48 : 44;

  const base = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 'var(--space-2)',
    minHeight: height,
    minWidth: height,
    padding: pad,
    border: 'var(--hairline-width) solid var(--border)',
    borderRadius: 'var(--radius-control)',
    background: 'var(--panel)',
    color: 'var(--fg)',
    font: `var(--weight-medium) var(--text-body)/var(--leading-tight) var(--font-mono)`,
    letterSpacing: 'var(--tracking-title)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.55 : 1,
    width: full ? '100%' : undefined,
    transition: `opacity var(--dur-fast) var(--ease-out), border-color var(--dur-fast) var(--ease-out)`,
    WebkitTapHighlightColor: 'transparent',
  };

  const variants = {
    primary: {
      borderColor: 'var(--accent)',
      color: 'var(--accent)',
      background: 'var(--tint-accent-weak)',
    },
    secondary: {},
    ghost: { borderColor: 'transparent', background: 'transparent', color: 'var(--dim)' },
    danger: { borderColor: 'var(--danger)', color: 'var(--danger)', background: 'transparent' },
  };

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      style={{ ...base, ...variants[variant], ...style }}
      {...rest}
    >
      {children}
    </button>
  );
}
