/*
 * Fixture for the UI kit, lifted from numberstationsApp/src/data/stations.ts.
 * Real designators, operators, frequencies, dates and sources — abbreviated to the
 * rows a screen needs. 141 stations exist; 12 stand in for them here.
 */
window.EchoData = {
  receivers: [
    { id: 'kiwi-1', label: 'Moscow region', grid: 'KO85', location: 'Moscow region, RU' },
    { id: 'kiwi-2', label: 'Tampere', grid: 'KP21', location: 'Tampere, FI' },
  ],
  directory: [
    { location: 'Moscow region, RU', grid: 'KO85', users: 3, usersMax: 7, snr: 31 },
    { location: 'Tampere, FI', grid: 'KP21', users: 1, usersMax: 4, snr: 27 },
    { location: 'Kaliningrad, RU', grid: 'KO04', users: 4, usersMax: 4, snr: 24 },
    { location: 'Warsaw, PL', grid: 'KO02', users: 0, usersMax: 8, snr: 19 },
    { location: 'Bucharest, RO', grid: 'KN34', users: 2, usersMax: 6, snr: 17 },
    { location: 'Reykjavik, IS', grid: 'HP94', users: 1, usersMax: 4, snr: 12 },
  ],
  directoryTotal: 776,
  stations: [
    {
      id: 'S28', name: 'The Buzzer', operator: 'Russian military, 69th communications hub',
      tier: 'live', classification: 'Slavic voice', periodSec: 2.4,
      marker: '~1.2 s buzz tone, repeating ~25 times per minute, 24 hours a day',
      lastConfirmed: '2025-11-15', aliases: ['UVB-76', 'MDZhB', 'ZhUOZ', 'ANVF'],
      lore: 'The best known of the Russian channel markers. "UVB-76" is an obsolete callsign from the 1970s and 80s and is not what the station transmits today: voice identifiers observed since 2010 run MDZhB, then ZhUOZ from 2019, then ANVF. The transmitter site moved from Povarovo to Naro-Fominsk in 2010. Voice messages interrupt the buzzer irregularly and are read in the Russian phonetic alphabet; monitors logged a marked increase in them through 2025, peaking in March and April.',
      frequencies: [{ khz: 4625, mode: 'USB', timeOfDay: null, lastConfirmed: '2025-11-15', sourceUrl: 'https://en.wikipedia.org/wiki/UVB-76' }],
      hearings: [
        { when: '2026-09-10 14:22', khz: 4625, periodSec: 2.38, receiver: 'Moscow region' },
        { when: '2026-09-10 13:19', khz: 4625, periodSec: 2.41, receiver: 'Moscow region' },
      ],
    },
    {
      id: 'S30', name: 'The Pip', operator: 'Russian military, North Caucasus communications centre (callsign Akacia)',
      tier: 'live', classification: 'Slavic voice', periodSec: 1.2,
      marker: 'Short beep, repeating ~50 times per minute',
      lastConfirmed: '2025-01-01', aliases: ['8S1Shch', 'Akacia'],
      lore: 'A companion marker to The Buzzer, running a faster and much shorter pulse. Radioscanner attributes it to a North Caucasus military district communications centre, callsign Akacia, formerly the 72nd communications centre. Like the Buzzer it carries occasional Russian voice traffic.',
      frequencies: [
        { khz: 5448, mode: 'USB', timeOfDay: 'day', lastConfirmed: '2025-01-01', sourceUrl: 'https://en.wikipedia.org/wiki/The_Pip' },
        { khz: 3756, mode: 'USB', timeOfDay: 'night', lastConfirmed: '2025-01-01', sourceUrl: 'https://en.wikipedia.org/wiki/The_Pip' },
      ],
      hearings: [],
    },
    {
      id: 'S32', name: 'The Squeaky Wheel', operator: 'Russian military, Southern district',
      tier: 'live', classification: 'Slavic voice', periodSec: null,
      marker: 'Repeating squeaking sweep', lastConfirmed: '2025-01-01', aliases: ['XSW'],
      disputed: true,
      lore: 'The third Russian marker, and the reason this database stores frequencies as sourced observations rather than constants: two different frequency pairs are published for it and neither source retracts the other. Both are listed below, flagged as disputed. Confirm against the waterfall before trusting either.',
      frequencies: [
        { khz: 5473, mode: 'USB', timeOfDay: 'day', lastConfirmed: '2021-12-01', sourceUrl: 'http://mt-milcom.blogspot.com/', disputed: true },
        { khz: 3828, mode: 'USB', timeOfDay: 'night', lastConfirmed: '2021-12-01', sourceUrl: 'http://mt-milcom.blogspot.com/', disputed: true },
        { khz: 5367, mode: 'USB', timeOfDay: 'day', lastConfirmed: '2025-01-01', sourceUrl: 'https://en.wikipedia.org/wiki/The_Squeaky_Wheel', disputed: true },
        { khz: 3363.5, mode: 'USB', timeOfDay: 'night', lastConfirmed: '2025-01-01', sourceUrl: 'https://en.wikipedia.org/wiki/The_Squeaky_Wheel', disputed: true },
      ],
      hearings: [],
    },
    {
      id: 'E11', name: 'Oblique', operator: 'Poland', tier: 'scheduled',
      classification: 'English voice', periodSec: null, marker: null,
      lastConfirmed: '2026-09-10', aliases: [],
      lore: 'An English-language station operated from Poland, which took over the role of G02 "Swedish Rhapsody". Transmissions open with a three-digit identifier and either carry a message or announce that there is none. Frequencies rotate month by month, so a slot that is silent on the frequency below may simply have moved.',
      frequencies: [], hearings: [],
    },
    { id: 'M01', name: 'M01', operator: 'Russia', tier: 'scheduled', classification: 'Morse', lastConfirmed: '2026-09-10', aliases: [], lore: null, frequencies: [], hearings: [] },
    { id: 'XPA2', name: 'Polytones', operator: 'Russia, SVR', tier: 'scheduled', classification: 'Digital (other)', lastConfirmed: '2026-09-10', aliases: [], lore: null, frequencies: [], hearings: [] },
    { id: 'F06', name: 'F06', operator: 'Russia', tier: 'scheduled', classification: 'Digital (FSK)', lastConfirmed: '2026-09-10', aliases: [], lore: null, frequencies: [], hearings: [] },
    {
      id: 'E03', name: 'The Lincolnshire Poacher', operator: 'United Kingdom, attributed to the Secret Intelligence Service',
      tier: 'historical', classification: 'English voice', lastConfirmed: '2008-07-02', aliases: [],
      lore: 'The most famous numbers station ever operated, and the one most listeners mean when they say "numbers station". Two bars of the English folk tune "The Lincolnshire Poacher" played as an interval signal, repeated twelve times, then a synthesised English female voice read five-figure groups. Transmitted from RAF Akrotiri in Cyprus. The final recorded transmission was on 2 July 2008.',
      frequencies: [], hearings: [],
    },
    {
      id: 'E03a', name: 'Cherry Ripe', operator: 'United Kingdom, attributed to the Secret Intelligence Service',
      tier: 'historical', classification: 'English voice', lastConfirmed: '2009-12-01', aliases: [],
      lore: 'The southern-hemisphere sister of E03, using the folk song "Cherry Ripe" as its interval signal. It transmitted for years from the US base on Guam, moved to Humpty Doo in Australia in late September 2009, ran there for only two months, and stopped in December 2009.',
      frequencies: [], hearings: [],
    },
    {
      id: 'V02a', name: 'Atención', operator: 'Cuba, Dirección General de Inteligencia',
      tier: 'historical', classification: 'Other-language voice', lastConfirmed: '2019-02-01',
      aliases: ['The Cuban Lady', 'The Spanish Lady'],
      lore: 'Opened with "¡Atención! ¡Atención!" and a synthesised Spanish female voice reading five-figure groups. V02a replaced the original V02 in 1997. Most of its schedules were taken over by the digital HM01 in November 2012, and it went inactive in February 2019 alongside its Morse counterpart M08a. Widely and wrongly still listed as active.',
      frequencies: [], hearings: [],
    },
    { id: 'M13c', name: 'M13c', operator: 'Bulgaria', tier: 'historical', classification: 'Morse', lastConfirmed: null, aliases: [], lore: null, frequencies: [], hearings: [] },
    { id: 'V30', name: 'The Lighthouse', operator: 'Vietnam', tier: 'historical', classification: 'Other-language voice', lastConfirmed: null, aliases: [], lore: null, frequencies: [], hearings: [] },
  ],
  schedule: [
    { id: 'E11', name: 'Oblique', utc: 'Mon 03:15 UTC', local: 'Mon 04:15', countdown: 'in 42 m', urgent: true, khz: 8102, note: 'ID 25. Frequency rotates monthly; 8102 kHz is the January listing.' },
    { id: 'E11', name: 'Oblique', utc: 'Tue 05:05 UTC', local: 'Tue 06:05', countdown: 'in 1 d 2 h', urgent: false, khz: 12153, note: 'ID 33. Frequency rotates monthly.' },
    { id: 'E11', name: 'Oblique', utc: 'Mon 06:00 UTC', local: 'Mon 07:00', countdown: 'in 3 h 27 m', urgent: false, khz: 20286, note: 'ID 94. Frequency rotates monthly.' },
    { id: 'E11', name: 'Oblique', utc: 'Fri 06:00 UTC', local: 'Fri 07:00', countdown: 'in 4 d 3 h', urgent: false, khz: 7850, note: 'ID 35. Frequency rotates monthly.' },
    { id: 'E11', name: 'Oblique', utc: 'Tue 06:45 UTC', local: 'Tue 07:45', countdown: 'in 1 d 4 h', urgent: false, khz: 12385, note: 'ID 51. Frequency rotates monthly.' },
  ],
  archiveLinks: [
    { label: 'Shortwave Radio Audio Archive', url: 'https://shortwavearchive.com/', description: 'Dated off-air recordings contributed by listeners.' },
    { label: 'Internet Archive', url: 'https://archive.org/', description: 'Long-form recordings and collections, including complete transmissions.' },
    { label: 'Signal Identification Wiki', url: 'https://www.sigidwiki.com/', description: 'Reference waveforms, spectrograms and sample audio for identification.' },
    { label: 'Priyom.org', url: 'https://priyom.org/', description: 'Logs, schedules and transmission history maintained by the community.' },
  ],
};
