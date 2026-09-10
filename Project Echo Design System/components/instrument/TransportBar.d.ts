/**
 * Fixed transport bar: the connect/stop control plus the synthetic marker.
 *
 */
export interface TransportBarProps {
  running?: boolean;
  connecting?: boolean;
  onConnect?: () => void;
  onStop?: () => void;
  onSynthetic?: () => void;
  /** Hidden when the Phase 3 server is absent. */
  showSynthetic?: boolean;
}

export declare function TransportBar(props: TransportBarProps): JSX.Element;
