/**
 * A public receiver from the proxied KiwiSDR directory.
 *
 */
export interface DirectoryRowProps {
  location: string;
  /** Channels in use. */
  users?: number | null;
  /** Channels the node publishes. Rendered as "3/7". */
  usersMax?: number | null;
  /** Reported signal-to-noise. Rows are sorted by this, best first. */
  snr?: number | null;
  /** Maidenhead grid square, used by the propagation overlay. */
  grid?: string;
  selected?: boolean;
  onAdopt?: () => void;
}

export declare function DirectoryRow(props: DirectoryRowProps): JSX.Element;
