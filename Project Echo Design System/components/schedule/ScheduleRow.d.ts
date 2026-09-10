/**
 * Upcoming transmission window.
 *
 */
export interface ScheduleRowProps {
  designator: string;
  name: string;
  /** As published: "Mon 03:15 UTC". */
  utc: string;
  /** The viewer's local rendering of the same instant. */
  local: string;
  /** "in 18 h 31 m", or "now" inside the first minute. */
  countdown: string;
  khz?: number | null;
  /** Frequency-rotation caveats and slot IDs go here, not in the main line. */
  note?: string | null;
  /** Under an hour — the countdown turns accent. */
  urgent?: boolean;
  alertOn?: boolean;
  alertDisabled?: boolean;
  onToggleAlert?: (on: boolean) => void;
}

export declare function ScheduleRow(props: ScheduleRowProps): JSX.Element;
