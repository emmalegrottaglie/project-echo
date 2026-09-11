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
  /**
   * ISO date this slot was last taken from the cited source.
   *
   * Schedules are not a timetable the operator publishes. They are a record of what
   * listeners have reported, and the frequencies move faster than the record follows —
   * an XPA transmission was reported live on 10237 kHz while the table this was read
   * from had no September frequency for that slot at all. So the date is not decoration:
   * it is the difference between "this is where it transmits" and "this is where it was
   * last heard to transmit", and only the second one is true.
   */
  lastConfirmed: string;
  note: string | null;
  sourceUrl: string;
}

/**
 * A transmitter site.
 *
 * Plural on a station, and with a status, because the sources genuinely disagree and the
 * disagreement is the interesting part. The Buzzer has three between them:
 * numbers-stations.com reports one site "confirmed" near St Petersburg and a second
 * "claimed" at Naro-Fominsk where the 69th communications centre sits, and both it and
 * Wikipedia record the original Povarovo site as abandoned since 2010. Collapsing that
 * into one pair of coordinates would be inventing a fact none of them states.
 *
 * A station with no sourced position has an empty array. Wikidata carries a coordinate
 * for The Squeaky Wheel that its own article leaves blank, and a guessed position with a
 * provenance stamp on it is worse than none — so it is not here.
 */
export interface Site {
  /** Place name as the source gives it, e.g. 'Naro-Fominsk, Moscow Oblast'. */
  name: string;
  /** Decimal degrees, north and east positive. */
  lat: number;
  lon: number;
  /**
   * The source's own word for how firmly it places the transmitter here.
   * `former` is a site the sources agree has been abandoned.
   */
  status: 'confirmed' | 'claimed' | 'former';
  /** ISO date the cited source last supported this. */
  lastConfirmed: string;
  sourceUrl: string;
}

/**
 * A year one of the sources states, kept with the words it stated it in.
 *
 * Both ends of a station's life are recorded this way, and both are hedged in the
 * sources. Wikipedia says outright that the precise date the Lincolnshire Poacher began
 * "is not known for certain", and dates the Buzzer only to "around the late 1970s";
 * Priyom's pages say "Ceased in 2001" about one station and "Last heard in 1996" about
 * the next, which are not the same claim at all.
 *
 * So `year` exists to place a mark on an axis and `note` carries what the source
 * actually said. `approximate` marks the gap between the two: a stated fact about the
 * station, or an observation that only bounds one. A first hearing is approximate
 * because the station may have been transmitting unheard before it, and a last hearing
 * is approximate because it may have gone on transmitting unheard after — where a page
 * says the station ceased, or names the day it started, it is not. The interface shows
 * the note, never the bare year, whenever this is approximate.
 */
export interface SourcedYear {
  /** Used for placement only. Never shown alone when `approximate` is true. */
  year: number;
  approximate: boolean;
  /** The source's own phrasing, e.g. 'first noticed around the late 1970s'. */
  note: string;
  lastConfirmed: string;
  sourceUrl: string;
}

/**
 * A station's background prose, and whose words it is.
 *
 * Most of it is quoted rather than written. Priyom publish a description for nearly
 * every station on the roster, and quoting them with a link is both more honest and more
 * useful than paraphrasing work we did not do — their data is CC BY-NC-SA 4.0, which
 * requires exactly this attribution. `quotedFrom` is the page it came from, and `null`
 * where the paragraph was written for this archive out of the sources in `sourceUrls`.
 * The UI renders the two differently, because a reader deserves to know which they are
 * reading.
 */
export interface Lore {
  text: string;
  quotedFrom: string | null;
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
  /** Long-form background, or `null` where no source has been read for one yet. */
  lore: Lore | null;
  frequencies: Frequency[];
  schedules: Schedule[];
  /** Known transmitter sites, empty where none is sourced. */
  sites: Site[];
  /** When it started, where a source says so. Null for most of the roster. */
  activeFrom: SourcedYear | null;
  /**
   * When it stopped, where a source says so. Distinct from `lastConfirmed`, which is an
   * ISO date this archive can stamp: a page saying "Last reported in late 1999" is a
   * real claim with no day in it, and forcing one would invent precision.
   */
  activeUntil: SourcedYear | null;
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
