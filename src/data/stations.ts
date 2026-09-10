import type { Station, Tier } from '../types';

/**
 * Station roster.
 *
 * Designators, names, operators and activity status come from the Priyom.org
 * category indexes (fetched 2026-09-10) cross-checked against Wikipedia and the
 * ENIGMA 2000 control list. Frequencies and schedules are only present where a
 * specific source confirmed them; every one carries its own `sourceUrl` and
 * `lastConfirmed` date, because sources genuinely disagree (see S32 below).
 *
 * Entries built by `roster()` are deliberately thin — designator, name, operator and
 * status only. They exist so the archive is complete rather than a curated handful,
 * and the UI marks them as not-yet-detailed instead of pretending the blank fields
 * are the station.
 */

const PRIYOM = 'https://priyom.org/number-stations';
const PRIYOM_MIL = 'https://priyom.org/military-stations';
const ENIGMA_LIST =
  'http://www.signalshed.com/docs/ENIGMA%202000%20Active%20Stations%20List%20V1.3.pdf';

/** ENIGMA designator prefix conventions, surfaced in the UI rather than hidden. */
export const PREFIX_MEANING: Record<string, string> = {
  E: 'English voice',
  G: 'German voice',
  S: 'Slavic voice',
  V: 'Other-language voice',
  M: 'Morse',
  F: 'Digital (FSK)',
  P: 'Digital (PSK)',
  X: 'Digital (other)',
  H: 'Digital (hybrid voice + data)',
};

export function prefixMeaning(enigmaId: string): string {
  const head = enigmaId.slice(0, 2) === 'HM' ? 'H' : enigmaId.slice(0, 1);
  return PREFIX_MEANING[head] ?? 'Unclassified';
}

interface RosterInput {
  id: string;
  name?: string;
  operator: string;
  tier: Tier;
  language: string;
  /** Path under priyom.org/number-stations, e.g. 'english/e06'. */
  path: string;
  lastConfirmed?: string;
}

/** A roster-only entry: sourced identity and status, no imported detail. */
function roster(input: RosterInput): Station {
  const url = `${PRIYOM}/${input.path}`;
  return {
    enigmaId: input.id,
    name: input.name ?? input.id,
    aliases: [],
    language: input.language,
    operator: input.operator,
    tier: input.tier,
    marker: null,
    markerPeriodSec: null,
    lastConfirmed: input.lastConfirmed ?? null,
    lore: null,
    frequencies: [],
    schedules: [],
    sourceUrls: [url, ENIGMA_LIST],
  };
}

/** The live tier — continuously transmitting channel markers, the only honest "live" view. */
const LIVE: Station[] = [
  {
    enigmaId: 'S28',
    name: 'The Buzzer',
    aliases: ['UVB-76', 'MDZhB', 'ZhUOZ', 'ANVF'],
    language: 'Slavic voice',
    operator: 'Russian military, 69th communications hub',
    tier: 'live',
    marker: '1.25 s buzz tone with a 1.85 s pause, about 19 times per minute, 24 hours a day',
    markerPeriodSec: 3.1,
    lastConfirmed: '2026-09-10',
    lore:
      'The best known of the Russian channel markers. "UVB-76" is an obsolete callsign ' +
      'from the 1970s and 80s and is not what the station transmits today: voice ' +
      'identifiers observed since 2010 run MDZhB, then ZhUOZ from 2019, then ANVF. The ' +
      'transmitter site moved from Povarovo to Naro-Fominsk in 2010. Voice messages ' +
      'interrupt the buzzer irregularly and are read in the Russian phonetic alphabet; ' +
      'monitors logged a marked increase in them through 2025, peaking in March and April.' +
      '\n\n' +
      'The pulse rate is worth reading carefully. Wikipedia summarises this station as ' +
      '"approximately 25 tones per minute", and the page it cites for that actually ' +
      'gives a 1.25 s tone with a 1.85 s pause — a 3.1 s period, about 19 per minute. ' +
      'This installation measured 3.40 s through a receiver in France on 2026-09-10, ' +
      'which agrees with the detailed figure and not with the summary. The 25-per-minute ' +
      'number appears to be an error in the summarising rather than a change on the air.',
    frequencies: [
      {
        khz: 4625,
        mode: 'USB',
        timeOfDay: null,
        lastConfirmed: '2025-11-15',
        sourceUrl: 'https://en.wikipedia.org/wiki/UVB-76',
        disputed: false,
      },
    ],
    schedules: [],
    sourceUrls: [
      'https://www.numbers-stations.com/russia/the-buzzer/',
      'https://en.wikipedia.org/wiki/UVB-76',
      'https://shortwavearchive.com/archive/the-buzzer-uvb-76-august-8-2025',
    ],
  },
  {
    enigmaId: 'S30',
    name: 'The Pip',
    aliases: ['8S1Shch', 'Akacia'],
    language: 'Slavic voice',
    operator: 'Russian military, North Caucasus communications centre (callsign Akacia)',
    tier: 'live',
    marker: 'Short beep, repeating ~50 times per minute',
    markerPeriodSec: 1.2,
    lastConfirmed: '2025-01-01',
    lore:
      'A companion marker to The Buzzer, running a faster and much shorter pulse. ' +
      'Radioscanner attributes it to a North Caucasus military district communications ' +
      'centre, callsign Akacia, formerly the 72nd communications centre — not the ' +
      'Southern district, which is where The Squeaky Wheel is usually placed. Like the ' +
      'Buzzer it carries occasional Russian voice traffic.',
    frequencies: [
      {
        khz: 5448,
        mode: 'USB',
        timeOfDay: 'day',
        lastConfirmed: '2025-01-01',
        sourceUrl: 'https://en.wikipedia.org/wiki/The_Pip',
        disputed: false,
      },
      {
        khz: 3756,
        mode: 'USB',
        timeOfDay: 'night',
        lastConfirmed: '2025-01-01',
        sourceUrl: 'https://en.wikipedia.org/wiki/The_Pip',
        disputed: false,
      },
    ],
    schedules: [],
    sourceUrls: [
      'https://en.wikipedia.org/wiki/The_Pip',
      `${PRIYOM_MIL}/russia/the-pip`,
    ],
  },
  {
    enigmaId: 'S32',
    name: 'The Squeaky Wheel',
    aliases: ['XSW'],
    language: 'Slavic voice',
    operator: 'Russian military, Southern district',
    tier: 'live',
    marker: 'Repeating squeaking sweep',
    markerPeriodSec: null,
    lastConfirmed: '2025-01-01',
    lore:
      'The third Russian marker, and the reason this database stores frequencies as ' +
      'sourced observations rather than constants: two different frequency pairs are ' +
      'published for it and neither source retracts the other. Both are listed below, ' +
      'flagged as disputed. Confirm against the waterfall before trusting either.',
    frequencies: [
      {
        khz: 5473,
        mode: 'USB',
        timeOfDay: 'day',
        lastConfirmed: '2021-12-01',
        sourceUrl: 'http://mt-milcom.blogspot.com/2021/12/the-world-of-strange-military-stations.html',
        disputed: true,
      },
      {
        khz: 3828,
        mode: 'USB',
        timeOfDay: 'night',
        lastConfirmed: '2021-12-01',
        sourceUrl: 'http://mt-milcom.blogspot.com/2021/12/the-world-of-strange-military-stations.html',
        disputed: true,
      },
      {
        khz: 5367,
        mode: 'USB',
        timeOfDay: 'day',
        lastConfirmed: '2025-01-01',
        sourceUrl: 'https://en.wikipedia.org/wiki/The_Squeaky_Wheel',
        disputed: true,
      },
      {
        khz: 3363.5,
        mode: 'USB',
        timeOfDay: 'night',
        lastConfirmed: '2025-01-01',
        sourceUrl: 'https://en.wikipedia.org/wiki/The_Squeaky_Wheel',
        disputed: true,
      },
    ],
    schedules: [],
    sourceUrls: [
      'https://en.wikipedia.org/wiki/The_Squeaky_Wheel',
      'http://www.mysterysignals.signalshed.com/page21.html',
    ],
  },
];

/**
 * E11 "Oblique" — the one station whose real schedule is imported, so the schedule
 * view has something true to count down to.
 *
 * Partial import: Priyom lists further slots through 20:00 UTC that are not here yet.
 * Frequencies rotate monthly per Priyom's month columns, so each slot records its
 * January frequency and says so in `note` rather than presenting it as fixed.
 */
const E11_SCHEDULE_SOURCE = `${PRIYOM}/english/e11/schedule`;

const E11: Station = {
  enigmaId: 'E11',
  name: 'Oblique',
  aliases: [],
  language: 'English voice',
  operator: 'Poland',
  tier: 'scheduled',
  marker: null,
  markerPeriodSec: null,
  lastConfirmed: '2026-09-10',
  lore:
    'An English-language station operated from Poland, which took over the role of G02 ' +
    '"Swedish Rhapsody". Transmissions open with a three-digit identifier and either ' +
    'carry a message or announce that there is none. Frequencies rotate month by month, ' +
    'so a slot that is silent on the frequency below may simply have moved.',
  frequencies: [],
  schedules: [
    { rrule: 'FREQ=WEEKLY;BYDAY=MO,WE;BYHOUR=3;BYMINUTE=15', khz: 8102, note: 'ID 25. Frequency rotates monthly; 8102 kHz is the January listing.', sourceUrl: E11_SCHEDULE_SOURCE },
    { rrule: 'FREQ=WEEKLY;BYDAY=TU,TH;BYHOUR=5;BYMINUTE=5', khz: 12153, note: 'ID 33. Frequency rotates monthly.', sourceUrl: E11_SCHEDULE_SOURCE },
    { rrule: 'FREQ=WEEKLY;BYDAY=MO,WE;BYHOUR=6;BYMINUTE=0', khz: 20286, note: 'ID 94. Frequency rotates monthly.', sourceUrl: E11_SCHEDULE_SOURCE },
    { rrule: 'FREQ=WEEKLY;BYDAY=FR,SU;BYHOUR=6;BYMINUTE=0', khz: 7850, note: 'ID 35. Frequency rotates monthly.', sourceUrl: E11_SCHEDULE_SOURCE },
    { rrule: 'FREQ=WEEKLY;BYDAY=TU,TH;BYHOUR=6;BYMINUTE=45', khz: 12385, note: 'ID 51. Frequency rotates monthly.', sourceUrl: E11_SCHEDULE_SOURCE },
    { rrule: 'FREQ=WEEKLY;BYDAY=MO,WE;BYHOUR=6;BYMINUTE=45', khz: 13911, note: 'ID 41. Frequency rotates monthly.', sourceUrl: E11_SCHEDULE_SOURCE },
    { rrule: 'FREQ=WEEKLY;BYDAY=TU,FR;BYHOUR=7;BYMINUTE=0', khz: 6804, note: 'ID 57. Frequency rotates monthly.', sourceUrl: E11_SCHEDULE_SOURCE },
    { rrule: 'FREQ=WEEKLY;BYDAY=SA,SU;BYHOUR=7;BYMINUTE=0', khz: 5371, note: 'ID 49. Frequency rotates monthly.', sourceUrl: E11_SCHEDULE_SOURCE },
  ],
  sourceUrls: [`${PRIYOM}/english/e11`, E11_SCHEDULE_SOURCE],
};

/** Historical stations with enough documented history to be worth a page of their own. */
const HISTORICAL_DETAILED: Station[] = [
  {
    enigmaId: 'E03',
    name: 'The Lincolnshire Poacher',
    aliases: [],
    language: 'English voice',
    operator: 'United Kingdom, attributed to the Secret Intelligence Service',
    tier: 'historical',
    marker: null,
    markerPeriodSec: null,
    lastConfirmed: '2008-07-02',
    lore:
      'The most famous numbers station ever operated, and the one most listeners mean ' +
      'when they say "numbers station". Two bars of the English folk tune "The ' +
      'Lincolnshire Poacher" played as an interval signal, repeated twelve times, then a ' +
      'synthesised English female voice read five-figure groups. Transmitted from RAF ' +
      'Akrotiri in Cyprus. The final recorded transmission was on 2 July 2008.',
    frequencies: [],
    schedules: [],
    sourceUrls: [
      'https://en.wikipedia.org/wiki/Lincolnshire_Poacher_(numbers_station)',
      'https://www.numbersoddities.nl/E03-profile.pdf',
    ],
  },
  {
    enigmaId: 'E03a',
    name: 'Cherry Ripe',
    aliases: [],
    language: 'English voice',
    operator: 'United Kingdom, attributed to the Secret Intelligence Service',
    tier: 'historical',
    marker: null,
    markerPeriodSec: null,
    lastConfirmed: '2009-12-01',
    lore:
      'The southern-hemisphere sister of E03, using the folk song "Cherry Ripe" as its ' +
      'interval signal. It transmitted for years from the US base on Guam, moved to ' +
      'Humpty Doo in Australia in late September 2009, ran there for only two months, ' +
      'and stopped in December 2009.',
    frequencies: [],
    schedules: [],
    sourceUrls: [
      'https://en.wikipedia.org/wiki/Cherry_Ripe_(numbers_station)',
      'https://www.numbersoddities.nl/E03-profile.pdf',
    ],
  },
  {
    enigmaId: 'V02a',
    name: 'Atención',
    aliases: ['The Cuban Lady', 'The Spanish Lady'],
    language: 'Other-language voice',
    operator: 'Cuba, Dirección General de Inteligencia',
    tier: 'historical',
    marker: null,
    markerPeriodSec: null,
    lastConfirmed: '2019-02-01',
    lore:
      'Opened with "¡Atención! ¡Atención!" and a synthesised Spanish female voice reading ' +
      'five-figure groups. V02a replaced the original V02 in 1997. Most of its schedules ' +
      'were taken over by the digital HM01 in November 2012, and it went inactive in ' +
      'February 2019 alongside its Morse counterpart M08a. Widely and wrongly still ' +
      'listed as active.',
    frequencies: [],
    schedules: [],
    sourceUrls: [`${PRIYOM}/other/v02a`, 'https://www.numbers-stations.com/various/v02a/'],
  },
  {
    enigmaId: 'HM01',
    name: 'HM01',
    aliases: ['De La Chica'],
    language: 'Digital (hybrid voice + data)',
    operator: 'Cuba, Dirección General de Inteligencia',
    tier: 'historical',
    marker: null,
    markerPeriodSec: null,
    lastConfirmed: '2024-08-23',
    lore:
      'A hybrid station: spoken Spanish groups interleaved with RDFT digital data bursts. ' +
      'It appeared around 2012 and absorbed most of the schedules of V02a and SK01. On ' +
      '23 August 2024 the transmitter failed permanently shortly after switching from ' +
      '11635 kHz to 10715 kHz, and with Radio Habana Cuba short of working transmitters ' +
      'the station has stayed off in favour of regular service. Repairs were reported in ' +
      'progress during 2026, so this one may move back to the active tier. Priyom’s ' +
      'index still lists it as active; its own station page does not.',
    frequencies: [
      {
        khz: 11635,
        mode: 'USB',
        timeOfDay: null,
        lastConfirmed: '2024-08-23',
        sourceUrl: `${PRIYOM}/digital/hm01`,
        disputed: false,
      },
    ],
    schedules: [],
    sourceUrls: [`${PRIYOM}/digital/hm01`],
  },
  {
    enigmaId: 'V15',
    name: 'Pyongyang',
    aliases: [],
    language: 'Other-language voice',
    operator: 'North Korea, Pyongyang Broadcasting Station',
    tier: 'historical',
    marker: null,
    markerPeriodSec: null,
    lastConfirmed: '2020-03-12',
    lore:
      'Unusual among numbers stations for hiding in plain sight: the groups aired inside ' +
      'normal Pyongyang Broadcasting Station programming, framed as lists of review ' +
      'assignments for distance-learning university students. Broadcasts ran weekly ' +
      'until 27 June 2019, then only four more times — 19 September and 9 November 2019, ' +
      'and 7 and 12 March 2020. Nothing since.',
    frequencies: [],
    schedules: [],
    sourceUrls: [`${PRIYOM}/other/v15`],
  },
  {
    enigmaId: 'V24',
    name: 'V24',
    aliases: [],
    language: 'Other-language voice',
    operator: 'South Korea',
    tier: 'historical',
    marker: null,
    markerPeriodSec: null,
    lastConfirmed: '2020-09-01',
    lore:
      'A Korean-language station: musical introduction, a three or four digit identifier, ' +
      'a message length announcement, then groups of four or five digits read twice, and ' +
      'a closing statement. Last heard in September 2020 and inactive since.',
    frequencies: [],
    schedules: [],
    sourceUrls: [`${PRIYOM}/other/v24`],
  },
  {
    enigmaId: 'G02',
    name: 'Swedish Rhapsody',
    aliases: [],
    language: 'German voice',
    operator: 'Poland',
    tier: 'historical',
    marker: null,
    markerPeriodSec: null,
    lastConfirmed: null,
    lore:
      'A German-language Polish station that opened with a music-box rendition of ' +
      '"Swedish Rhapsody" and a child-sounding synthesised voice — the combination that ' +
      'gives it its reputation. Its operational role passed to E11 "Oblique". No German ' +
      'language numbers station remains in regular operation.',
    frequencies: [],
    schedules: [],
    sourceUrls: [`${PRIYOM}/german/g02`],
  },
  {
    enigmaId: 'G03',
    name: 'Gongs or Chimes',
    aliases: ['Gong Station'],
    language: 'German voice',
    operator: 'East Germany, Nationale Volksarmee',
    tier: 'historical',
    marker: null,
    markerPeriodSec: null,
    lastConfirmed: null,
    lore:
      'Used a synthesised chime or gong melody ahead of German numbers. Priyom attributes ' +
      'it to the East German Nationale Volksarmee, not the Stasi — the Stasi attribution ' +
      'attaches to G08 "Four Note Rising Scale". The popular Stasi claim for G03 could not ' +
      'be traced to a primary source.',
    frequencies: [],
    schedules: [],
    sourceUrls: [`${PRIYOM}/german/g03`],
  },
];

/**
 * The rest of the roster.
 *
 * Status per the Priyom category indexes, fetched 2026-09-10. Names are given where
 * Priyom publishes a nickname; bare designators are stations it lists without one.
 */
const ROSTER: Station[] = [
  // --- English voice ---
  roster({ id: 'E06', name: 'English Man 00000', operator: 'Russia', tier: 'scheduled', language: 'English voice', path: 'english/e06', lastConfirmed: '2026-09-10' }),
  roster({ id: 'E07', name: 'English Man 000 000', operator: 'Russia', tier: 'scheduled', language: 'English voice', path: 'english/e07', lastConfirmed: '2025-04-10' }),
  roster({ id: 'E25', name: 'Rebeat', operator: 'Egypt', tier: 'scheduled', language: 'English voice', path: 'english/e25', lastConfirmed: '2026-09-10' }),
  roster({ id: 'E01', name: 'Ready Ready', operator: 'Unknown', tier: 'historical', language: 'English voice', path: 'english/e01' }),
  roster({ id: 'E05', name: 'The Counting Station', operator: 'United States', tier: 'historical', language: 'English voice', path: 'english/e05' }),
  roster({ id: 'E07a', name: 'English Man 000 000', operator: 'Russia', tier: 'historical', language: 'English voice', path: 'english/e07a' }),
  roster({ id: 'E09', name: 'Magnetic Fields', operator: 'Unknown', tier: 'historical', language: 'English voice', path: 'english/e09' }),
  roster({ id: 'E10', name: 'NATO Alphabet', operator: 'Israel', tier: 'historical', language: 'English voice', path: 'english/e10' }),
  roster({ id: 'E12', name: 'NNN', operator: 'Austria', tier: 'historical', language: 'English voice', path: 'english/e12' }),
  roster({ id: 'E13', name: 'Five Dashes', operator: 'Germany', tier: 'historical', language: 'English voice', path: 'english/e13' }),
  roster({ id: 'E14', name: "Counting 'Control'", operator: 'United States', tier: 'historical', language: 'English voice', path: 'english/e14' }),
  roster({ id: 'E15', name: 'Nancy Adam Susan', operator: 'Unknown', tier: 'historical', language: 'English voice', path: 'english/e15' }),
  roster({ id: 'E16', name: 'Two Letter', operator: 'Germany', tier: 'historical', language: 'English voice', path: 'english/e16' }),
  roster({ id: 'E17', name: 'English Lady 00000', operator: 'Russia', tier: 'historical', language: 'English voice', path: 'english/e17' }),
  roster({ id: 'E17z', name: 'English Lady 0 0 0 0 0', operator: 'Ukraine', tier: 'historical', language: 'English voice', path: 'english/e17z' }),
  roster({ id: 'E18', name: 'Fife Free', operator: 'Bulgaria', tier: 'historical', language: 'English voice', path: 'english/e18' }),
  roster({ id: 'E21', name: '4F Counting', operator: 'United States', tier: 'historical', language: 'English voice', path: 'english/e21' }),
  roster({ id: 'E23', operator: 'Poland', tier: 'historical', language: 'English voice', path: 'english/e23' }),
  roster({ id: 'E25b', name: 'Rebeat', operator: 'Egypt', tier: 'historical', language: 'English voice', path: 'english/e25b' }),

  // --- Slavic voice ---
  roster({ id: 'S06', name: 'Russian Man 00000', operator: 'Russia', tier: 'scheduled', language: 'Slavic voice', path: 'slavic/s06', lastConfirmed: '2026-09-10' }),
  roster({ id: 'S06c', operator: 'Russia', tier: 'scheduled', language: 'Slavic voice', path: 'slavic/s06c', lastConfirmed: '2026-09-10' }),
  roster({ id: 'S11a', name: 'Cherta', operator: 'Poland', tier: 'scheduled', language: 'Slavic voice', path: 'slavic/s11a', lastConfirmed: '2026-09-10' }),
  roster({ id: 'S25', name: 'Russian Man Control', operator: 'Russia', tier: 'scheduled', language: 'Slavic voice', path: 'slavic/s25', lastConfirmed: '2026-09-10' }),
  roster({ id: 'S02', name: 'Drums and Trumpets', operator: 'Bulgaria', tier: 'historical', language: 'Slavic voice', path: 'slavic/s02' }),
  roster({ id: 'S02a', operator: 'Bulgaria', tier: 'historical', language: 'Slavic voice', path: 'slavic/s02a' }),
  roster({ id: 'S02c', operator: 'Bulgaria', tier: 'historical', language: 'Slavic voice', path: 'slavic/s02c' }),
  roster({ id: 'S02d', operator: 'Bulgaria', tier: 'historical', language: 'Slavic voice', path: 'slavic/s02d' }),
  roster({ id: 'S03', name: 'Okno', operator: 'Czechia', tier: 'historical', language: 'Slavic voice', path: 'slavic/s03' }),
  roster({ id: 'S04', name: 'Edna Sednitzer', operator: 'Bulgaria', tier: 'historical', language: 'Slavic voice', path: 'slavic/s04' }),
  roster({ id: 'S05', name: 'OLX', operator: 'Czechoslovakia', tier: 'historical', language: 'Slavic voice', path: 'slavic/s05' }),
  roster({ id: 'S05a', operator: 'Czechoslovakia', tier: 'historical', language: 'Slavic voice', path: 'slavic/s05a' }),
  roster({ id: 'S05b', operator: 'Czechia', tier: 'historical', language: 'Slavic voice', path: 'slavic/s05b' }),
  roster({ id: 'S06a', name: 'Russian Man 00000', operator: 'Soviet Union', tier: 'historical', language: 'Slavic voice', path: 'slavic/s06a' }),
  roster({ id: 'S06s', name: 'Russian Lady 0 0 0 0 0', operator: 'Ukraine', tier: 'historical', language: 'Slavic voice', path: 'slavic/s06s' }),
  roster({ id: 'S07', name: 'Russian Man 000 000', operator: 'Russia', tier: 'historical', language: 'Slavic voice', path: 'slavic/s07' }),
  roster({ id: 'S08', name: 'YT', operator: 'Yugoslavia', tier: 'historical', language: 'Slavic voice', path: 'slavic/s08' }),
  roster({ id: 'S10', name: 'Bulgarian Betty', operator: 'Czechoslovakia', tier: 'historical', language: 'Slavic voice', path: 'slavic/s10' }),
  roster({ id: 'S10a', operator: 'Czechoslovakia', tier: 'historical', language: 'Slavic voice', path: 'slavic/s10a' }),
  roster({ id: 'S10b', operator: 'Czechoslovakia', tier: 'historical', language: 'Slavic voice', path: 'slavic/s10b' }),
  roster({ id: 'S10d', operator: 'Czechia', tier: 'historical', language: 'Slavic voice', path: 'slavic/s10d' }),
  roster({ id: 'S10e', operator: 'Czechia', tier: 'historical', language: 'Slavic voice', path: 'slavic/s10e' }),
  roster({ id: 'S11', name: 'Kreska', operator: 'Poland', tier: 'historical', language: 'Slavic voice', path: 'slavic/s11' }),
  roster({ id: 'S17a', name: 'Czech Lady Control', operator: 'Czechia', tier: 'historical', language: 'Slavic voice', path: 'slavic/s17a' }),
  roster({ id: 'S17b', operator: 'Czechia', tier: 'historical', language: 'Slavic voice', path: 'slavic/s17b' }),
  roster({ id: 'S17c', operator: 'Czechia', tier: 'historical', language: 'Slavic voice', path: 'slavic/s17c' }),
  roster({ id: 'S21', name: 'Russian Man 0 0 0', operator: 'Russia', tier: 'historical', language: 'Slavic voice', path: 'slavic/s21' }),
  roster({ id: 'S26', name: 'Cyt Cyt', operator: 'Poland', tier: 'historical', language: 'Slavic voice', path: 'slavic/s26' }),
  roster({ id: 'S31', operator: 'Czechia', tier: 'historical', language: 'Slavic voice', path: 'slavic/s31' }),

  // --- German voice (none active) ---
  roster({ id: 'G01', name: 'Tyrolean Music Station', operator: 'France', tier: 'historical', language: 'German voice', path: 'german/g01' }),
  roster({ id: 'G04', name: 'Three Note Oddity', operator: 'Hungary', tier: 'historical', language: 'German voice', path: 'german/g04' }),
  roster({ id: 'G05', name: 'The Counting Station', operator: 'United States', tier: 'historical', language: 'German voice', path: 'german/g05' }),
  roster({ id: 'G06', name: 'German Lady 00000', operator: 'Russia', tier: 'historical', language: 'German voice', path: 'german/g06' }),
  roster({ id: 'G07', name: 'German Lady 000 000', operator: 'Russia', tier: 'historical', language: 'German voice', path: 'german/g07' }),
  roster({ id: 'G08', name: 'Four Note Rising Scale', operator: 'East Germany, Stasi', tier: 'historical', language: 'German voice', path: 'german/g08' }),
  roster({ id: 'G09', name: 'Saxophone Piece', operator: 'Unknown', tier: 'historical', language: 'German voice', path: 'german/g09' }),
  roster({ id: 'G10', name: 'Bert Kaempfert', operator: 'Poland', tier: 'historical', language: 'German voice', path: 'german/g10' }),
  roster({ id: 'G11', name: 'Strich', operator: 'Poland', tier: 'historical', language: 'German voice', path: 'german/g11' }),
  roster({ id: 'G12', name: 'NNN', operator: 'Austria', tier: 'historical', language: 'German voice', path: 'german/g12' }),
  roster({ id: 'G13', name: 'Five Dashes', operator: 'Germany', tier: 'historical', language: 'German voice', path: 'german/g13' }),
  roster({ id: 'G14', name: 'DFD21/DFC37', operator: 'Germany', tier: 'historical', language: 'German voice', path: 'german/g14' }),
  roster({ id: 'G15', name: 'Papa November', operator: 'Germany', tier: 'historical', language: 'German voice', path: 'german/g15' }),
  roster({ id: 'G16', name: 'Two Letter', operator: 'Germany', tier: 'historical', language: 'German voice', path: 'german/g16' }),
  roster({ id: 'G18', name: 'Eight Note Rising Scale', operator: 'Czechoslovakia', tier: 'historical', language: 'German voice', path: 'german/g18' }),
  roster({ id: 'G20', name: 'Spruch', operator: 'Unknown', tier: 'historical', language: 'German voice', path: 'german/g20' }),
  roster({ id: 'G22', name: 'Edna Sednitzer', operator: 'Bulgaria', tier: 'historical', language: 'German voice', path: 'german/g22' }),

  // --- Other-language voice ---
  roster({ id: 'V07', name: 'Spanish Lady 000 000', operator: 'Russia', tier: 'scheduled', language: 'Other-language voice', path: 'other/v07', lastConfirmed: '2026-09-10' }),
  roster({ id: 'V13', name: 'New Star Broadcasting Station', operator: 'Taiwan', tier: 'scheduled', language: 'Other-language voice', path: 'other/v13', lastConfirmed: '2026-09-10' }),
  roster({ id: 'V28', name: 'The Parrot', operator: 'North Korea', tier: 'scheduled', language: 'Other-language voice', path: 'other/v28', lastConfirmed: '2026-09-10' }),
  roster({ id: 'V01', name: 'Ciocârlia / Skylark', operator: 'Romania', tier: 'historical', language: 'Other-language voice', path: 'other/v01' }),
  roster({ id: 'V02', name: 'Atención', operator: 'Cuba', tier: 'historical', language: 'Other-language voice', path: 'other/v02' }),
  roster({ id: 'V06', name: 'Spanish Lady 00000', operator: 'Russia', tier: 'historical', language: 'Other-language voice', path: 'other/v06' }),
  roster({ id: 'V08', name: 'Eastern Music Station', operator: 'Egypt', tier: 'historical', language: 'Other-language voice', path: 'other/v08' }),
  roster({ id: 'V10', operator: 'Unknown', tier: 'historical', language: 'Other-language voice', path: 'other/v10' }),
  roster({ id: 'V12', name: 'NNN', operator: 'Austria', tier: 'historical', language: 'Other-language voice', path: 'other/v12' }),
  roster({ id: 'V14', name: "Counting 'Control'", operator: 'United States', tier: 'historical', language: 'Other-language voice', path: 'other/v14' }),
  roster({ id: 'V19', operator: 'Unknown', tier: 'historical', language: 'Other-language voice', path: 'other/v19' }),
  roster({ id: 'V20', name: 'The Bored Man', operator: 'Cuba', tier: 'historical', language: 'Other-language voice', path: 'other/v20' }),
  roster({ id: 'V30', name: 'The Lighthouse', operator: 'Vietnam', tier: 'historical', language: 'Other-language voice', path: 'other/v30' }),

  // --- Morse ---
  roster({ id: 'M01', operator: 'Russia', tier: 'scheduled', language: 'Morse', path: 'morse/m01', lastConfirmed: '2026-09-10' }),
  roster({ id: 'M01a', operator: 'Russia', tier: 'scheduled', language: 'Morse', path: 'morse/m01a', lastConfirmed: '2026-09-10' }),
  roster({ id: 'M12', operator: 'Russia', tier: 'scheduled', language: 'Morse', path: 'morse/m12', lastConfirmed: '2026-09-10' }),
  roster({ id: 'M14', operator: 'Russia', tier: 'scheduled', language: 'Morse', path: 'morse/m14', lastConfirmed: '2026-09-10' }),
  roster({ id: 'M23', operator: 'France', tier: 'scheduled', language: 'Morse', path: 'morse/m23', lastConfirmed: '2026-09-10' }),
  roster({ id: 'M01b', operator: 'Russia', tier: 'historical', language: 'Morse', path: 'morse/m01b' }),
  roster({ id: 'M02', operator: 'Austria', tier: 'historical', language: 'Morse', path: 'morse/m02' }),
  roster({ id: 'M03', operator: 'Poland', tier: 'historical', language: 'Morse', path: 'morse/m03' }),
  roster({ id: 'M03a', operator: 'Poland', tier: 'historical', language: 'Morse', path: 'morse/m03a' }),
  roster({ id: 'M03b', operator: 'Poland', tier: 'historical', language: 'Morse', path: 'morse/m03b' }),
  roster({ id: 'M03c', operator: 'Poland', tier: 'historical', language: 'Morse', path: 'morse/m03c' }),
  roster({ id: 'M03d', operator: 'Poland', tier: 'historical', language: 'Morse', path: 'morse/m03d' }),
  roster({ id: 'M03e', operator: 'Poland', tier: 'historical', language: 'Morse', path: 'morse/m03e' }),
  roster({ id: 'M03f', operator: 'Poland', tier: 'historical', language: 'Morse', path: 'morse/m03f' }),
  roster({ id: 'M04', operator: 'Poland', tier: 'historical', language: 'Morse', path: 'morse/m04' }),
  roster({ id: 'M05', operator: 'United Kingdom (unconfirmed)', tier: 'historical', language: 'Morse', path: 'morse/m05' }),
  roster({ id: 'M06', operator: 'Czechia', tier: 'historical', language: 'Morse', path: 'morse/m06' }),
  roster({ id: 'M06a', operator: 'Czechoslovakia', tier: 'historical', language: 'Morse', path: 'morse/m06a' }),
  roster({ id: 'M07', operator: 'Czechia', tier: 'historical', language: 'Morse', path: 'morse/m07' }),
  roster({ id: 'M08', operator: 'Cuba', tier: 'historical', language: 'Morse', path: 'morse/m08' }),
  roster({ id: 'M08a', operator: 'Cuba', tier: 'historical', language: 'Morse', path: 'morse/m08a', lastConfirmed: '2019-02-01' }),
  roster({ id: 'M10', operator: 'Czechia', tier: 'historical', language: 'Morse', path: 'morse/m10' }),
  roster({ id: 'M10c', operator: 'Czechoslovakia', tier: 'historical', language: 'Morse', path: 'morse/m10c' }),
  roster({ id: 'M11', operator: 'Unknown', tier: 'historical', language: 'Morse', path: 'morse/m11' }),
  roster({ id: 'M13', operator: 'Bulgaria', tier: 'historical', language: 'Morse', path: 'morse/m13' }),
  roster({ id: 'M13a', operator: 'Bulgaria', tier: 'historical', language: 'Morse', path: 'morse/m13a' }),
  roster({ id: 'M13b', operator: 'Bulgaria', tier: 'historical', language: 'Morse', path: 'morse/m13b' }),
  roster({ id: 'M13c', operator: 'Bulgaria', tier: 'historical', language: 'Morse', path: 'morse/m13c' }),
  roster({ id: 'M13d', operator: 'Bulgaria', tier: 'historical', language: 'Morse', path: 'morse/m13d' }),
  roster({ id: 'M13e', operator: 'Bulgaria', tier: 'historical', language: 'Morse', path: 'morse/m13e' }),
  roster({ id: 'M17', operator: 'Unknown', tier: 'historical', language: 'Morse', path: 'morse/m17' }),
  roster({ id: 'M29', operator: 'Hungary', tier: 'historical', language: 'Morse', path: 'morse/m29' }),
  roster({ id: 'M29a', operator: 'Hungary', tier: 'historical', language: 'Morse', path: 'morse/m29a' }),
  roster({ id: 'M39', operator: 'Czechia', tier: 'historical', language: 'Morse', path: 'morse/m39' }),
  roster({ id: 'M40', operator: 'North Korea', tier: 'historical', language: 'Morse', path: 'morse/m40' }),
  roster({ id: 'M45', operator: 'Russia', tier: 'historical', language: 'Morse', path: 'morse/m45' }),
  roster({ id: 'M94', operator: 'South Korea', tier: 'historical', language: 'Morse', path: 'morse/m94' }),
  roster({ id: 'M97', operator: 'Vietnam', tier: 'historical', language: 'Morse', path: 'morse/m97' }),

  // --- Digital ---
  roster({ id: 'F01', operator: 'Russia', tier: 'scheduled', language: 'Digital (FSK)', path: 'digital/f01', lastConfirmed: '2026-09-10' }),
  roster({ id: 'F03', operator: 'Poland', tier: 'scheduled', language: 'Digital (FSK)', path: 'digital/f03', lastConfirmed: '2026-09-10' }),
  roster({ id: 'F06', operator: 'Russia', tier: 'scheduled', language: 'Digital (FSK)', path: 'digital/f06', lastConfirmed: '2026-09-10' }),
  roster({ id: 'F06a', operator: 'Russia', tier: 'scheduled', language: 'Digital (FSK)', path: 'digital/f06a', lastConfirmed: '2026-09-10' }),
  roster({ id: 'F07', operator: 'Russia', tier: 'scheduled', language: 'Digital (FSK)', path: 'digital/f07', lastConfirmed: '2026-09-10' }),
  roster({ id: 'P03', operator: 'Poland', tier: 'scheduled', language: 'Digital (PSK)', path: 'digital/p03', lastConfirmed: '2026-09-10' }),
  roster({ id: 'P07', operator: 'Russia', tier: 'scheduled', language: 'Digital (PSK)', path: 'digital/p07', lastConfirmed: '2026-09-10' }),
  roster({ id: 'XPA', name: 'Polytones', operator: 'Russia, SVR', tier: 'scheduled', language: 'Digital (other)', path: 'digital/xpa', lastConfirmed: '2026-09-10' }),
  roster({ id: 'XPA2', name: 'Polytones', operator: 'Russia, SVR', tier: 'scheduled', language: 'Digital (other)', path: 'digital/xpa2', lastConfirmed: '2026-09-10' }),
  roster({ id: 'XPB', name: 'Polytones', operator: 'Russia, SVR', tier: 'scheduled', language: 'Digital (other)', path: 'digital/xpb', lastConfirmed: '2026-09-10' }),
  roster({ id: 'F11', operator: 'Poland', tier: 'historical', language: 'Digital (FSK)', path: 'digital/f11' }),
  roster({ id: 'SK01', operator: 'Cuba', tier: 'historical', language: 'Digital (other)', path: 'digital/sk01' }),
  roster({ id: 'XP', operator: 'Russia', tier: 'historical', language: 'Digital (other)', path: 'digital/xp' }),
];

export const STATIONS: Station[] = [...LIVE, E11, ...HISTORICAL_DETAILED, ...ROSTER];

export function byId(enigmaId: string): Station | undefined {
  return STATIONS.find((s) => s.enigmaId === enigmaId);
}

export function byTier(tier: Tier): Station[] {
  return STATIONS.filter((s) => s.tier === tier);
}

/** True when only identity and status are sourced — no detail imported yet. */
export function isRosterOnly(station: Station): boolean {
  return station.lore === null;
}
