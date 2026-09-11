import { allStations, designatorPrefix, PREFIX_MEANING } from './data/stations';
import { esc, openSheet, type Sheet } from './ui';

/**
 * What the designators mean.
 *
 * The archive is 141 rows of E11, S06c, XPA2 and M12, which look like inventory codes
 * and are in fact a classification: ENIGMA 2000 assign the leading letter by language
 * and mode, so the roster is already sorted by what a station sounds like. Somebody who
 * knows that can read the list; somebody who does not sees noise.
 *
 * It is a filter as well as a legend, which is the part that makes it worth building
 * rather than writing down. Each row carries how many stations share that letter and
 * applies it to the archive, so "Morse" stops being a note and becomes thirty-eight
 * stations you can look at.
 */

/** One example per family, chosen to be the one someone might recognise. */
const EXAMPLES: Record<string, string> = {
  E: 'E03 was the Lincolnshire Poacher',
  G: 'G02 was Swedish Rhapsody',
  S: 'S28 is The Buzzer',
  V: 'V02a was Atención',
  M: 'M12 is still running',
  F: 'F01 sends FSK bursts',
  P: 'P03 sends PSK',
  X: 'XPA are the Polytones',
  H: 'HM01 mixed spoken groups with data',
};

export interface Family {
  prefix: string;
  meaning: string;
  count: number;
  example: string;
}

/**
 * The families actually present in the roster, commonest first.
 *
 * Derived rather than listed: a prefix with no stations behind it would be a legend
 * entry for something the archive cannot show, and the counts have to come from the data
 * anyway or they rot the moment a station is added.
 */
export function families(): Family[] {
  const counts = new Map<string, number>();
  for (const station of allStations()) {
    const prefix = designatorPrefix(station.enigmaId);
    counts.set(prefix, (counts.get(prefix) ?? 0) + 1);
  }

  return [...counts.entries()]
    .filter(([prefix]) => PREFIX_MEANING[prefix])
    .map(([prefix, count]) => ({
      prefix,
      count,
      meaning: PREFIX_MEANING[prefix]!,
      example: EXAMPLES[prefix] ?? '',
    }))
    .sort((a, b) => b.count - a.count || a.prefix.localeCompare(b.prefix));
}

/** Opens the decoder. `onPick` receives a prefix, or '' when the reader clears it. */
export function openDecoder(onPick: (prefix: string) => void): Sheet {
  const sheet = openSheet(
    'What the codes mean',
    'ENIGMA 2000 assign the first letter by language and mode, so the designator ' +
      'already tells you what a station sounds like.',
    undefined,
  );

  sheet.body.innerHTML =
    families()
      .map(
        (family) =>
          `<button class="echo-family" type="button" data-prefix="${esc(family.prefix)}">` +
          `<span class="echo-family__letter">${esc(family.prefix)}</span>` +
          `<span class="echo-family__text">` +
          `<strong>${esc(family.meaning)}</strong>` +
          (family.example ? `<span>${esc(family.example)}</span>` : '') +
          `</span>` +
          `<span class="echo-family__count">${family.count}</span>` +
          `</button>`,
      )
      .join('') +
    `<p class="echo-family__note">` +
    `After the letter comes the station's number, and a trailing lowercase letter marks ` +
    `a variant — E06 and E06a are the same operator's station in two forms. A few ` +
    `designators break the pattern: HM01, SK01 and the XPA polytones carry a ` +
    `multi-letter prefix instead.` +
    `</p>`;

  sheet.body.addEventListener('click', (event) => {
    const row = (event.target as HTMLElement).closest<HTMLElement>('[data-prefix]');
    if (!row?.dataset.prefix) return;
    onPick(row.dataset.prefix);
    sheet.close();
  });

  return sheet;
}
