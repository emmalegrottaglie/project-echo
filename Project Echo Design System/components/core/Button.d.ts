import type { ReactNode, CSSProperties } from 'react';

/**
 * Transport and inline control.
 *
 */
export interface ButtonProps {
  /** primary = the load-bearing transport control; ghost = header/inline. */
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  /** lg is 48px tall, for the fixed transport bar. */
  size?: 'md' | 'lg';
  disabled?: boolean;
  /** Stretch to the container width (transport bar). */
  full?: boolean;
  type?: 'button' | 'submit';
  onClick?: () => void;
  children?: ReactNode;
  style?: CSSProperties;
}

export declare function Button(props: ButtonProps): JSX.Element;
