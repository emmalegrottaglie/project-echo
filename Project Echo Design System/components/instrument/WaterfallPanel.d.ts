/**
 * Spectrogram viewport — the app's centrepiece.
 *
 */
export interface WaterfallPanelProps {
  /** Viewport height in rows. 320 rows at 22 fps is ~14.5 s of history. */
  rows?: number;
  /** Which static representation to draw for design work. */
  mock?: 'detected' | 'noise' | 'blank';
  /** Long-press freeze state, with its crosshair badge. */
  frozen?: boolean;
  /** The tuned station's published marker period, for annotation. */
  periodSec?: number;
}

export declare function WaterfallPanel(props: WaterfallPanelProps): JSX.Element;
