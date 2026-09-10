import type { ReactNode } from 'react';

/**
 * Modal bottom sheet — the app's only modal surface.
 *
 */
export interface BottomSheetProps {
  open?: boolean;
  /** Mono, accent, sentence case. */
  title?: string;
  /** One honest line under the title — coverage, source, or a count. */
  note?: string;
  onDismiss?: () => void;
  children?: ReactNode;
  /** Max height. Defaults to 90%. */
  height?: string;
}

export declare function BottomSheet(props: BottomSheetProps): JSX.Element | null;
