/** Activity tiers. See docs/RESEARCH.md §2 — the tier is data, never a hardcoded badge. */
export type Tier = 'live' | 'scheduled' | 'historical';

/**
 * A frequency a station has been reported on.
 *
 * Sources disagree — S32 is published as both 5473/3828 kHz and 5367/3363.5 kHz —
 * so every row carries its own provenance and a `disputed` flag rather than the
 * database picking a winner. See docs/PLAN.md §3.
 */
export interface Frequency {
  khz: number;
  mode: string;
  /** 'day' | 'night' | null when the frequency is not time-of-day dependent. */
  timeOfDay: 'day' | 'night' | null;
  /** ISO date the frequency was last confirmed by the cited source. */
  lastConfirmed: string;
  sourceUrl: string;
  disputed: boolean;
}

/** A recurring transmission window, as an RFC 5545 RRULE evaluated in UTC. */
export interface Schedule {
  rrule: string;
  /**
   * The slot's frequency for each month, January at index 0, `null` where the source
   * publishes none for that month.
   *
   * Twelve entries rather than one because that is how these schedules are actually
   * published: E11's 03:15 slot runs 8102 kHz in January, 12630 in February and March,
   * 16530 from March to June. A single frequency with a note saying it rotates is the
   * shape this started as, and it is wrong eleven months of the year. Read it through
   * `scheduleKhz`, which picks the entry for the month an occurrence falls in — not the
   * month it happens to be when the page renders.
   */
  khzByMonth: (number | null)[];
  note: string | null;
  sourceUrl: string;
}

export interface Station {
  enigmaId: string;
  name: string;
  aliases: string[];
  /** Expanded from the ENIGMA prefix (E english, G german, S slavic, V other voice, M morse, X/HM digital). */
  language: string;
  operator: string;
  tier: Tier;
  /** Human description of the channel marker, e.g. '~1.2 s buzz, ~25/min'. */
  marker: string | null;
  /** Marker period in seconds, when the marker is periodic. Drives the live detector. */
  markerPeriodSec: number | null;
  /** ISO date this station was last confirmed on the air, or null if never confirmed. */
  lastConfirmed: string | null;
  /**
   * Long-form background. `null` marks a roster-only entry: the designator, name,
   * operator and status are sourced, but frequencies, schedules and history have not
   * been imported yet. The UI says so rather than implying the gap is the station.
   */
  lore: string | null;
  frequencies: Frequency[];
  schedules: Schedule[];
  sourceUrls: string[];
}

/** A public receiver the user may connect to. Their connection, their choice, their etiquette. */
export interface Receiver {
  id: string;
  label: string;
  /** Host and port, no scheme — the scheme is decided at connect time. */
  host: string;
  /** Maidenhead grid square, used for the propagation overlay. */
  grid: string;
  location: string;
  /** Receiver software. Only 'kiwisdr' is wired up in Phase 1. */
  kind: 'kiwisdr';
  notes: string | null;
}
