import { describeScheduleKhz } from './schedule';
import type { Station } from './types';
import { isSafeUrl } from './url';
import { button, esc, openSheet, type Sheet } from './ui';

/**
 * Reporting a wrong fact.
 *
 * This composes a prefilled GitHub issue rather than posting anywhere. The obvious
 * design — a form posting to `/api/corrections` — would have worked for almost nobody:
 * the server binds to loopback unless someone changes it, and the static client and the
 * Android build both run without one, so the person most likely to spot a wrong
 * frequency has no server to post to. GitHub needs no endpoint, no table, no rate
 * limiting and no moderation, and a report lands where corrections actually become
 * commits.
 *
 * A source URL is required, for the same reason every frequency carries one: a
 * correction without evidence cannot be acted on, and asking for it at the point of
 * reporting is cheaper than chasing it afterwards.
 *
 * Where the error is upstream, the form says so. Most facts here are Priyom's, and
 * fixing one there fixes it for everyone reading Priyom rather than only for this app.
 */

const REPOSITORY = 'https://github.com/emmalegrottaglie/project-echo';

/** The parts of a station a reader is likely to find wrong, and what we hold now. */
export interface Field {
  key: string;
  label: string;
  current: (station: Station) => string;
  /** True where the fact came from Priyom and is better fixed there. */
  upstream: boolean;
}

export const FIELDS: readonly Field[] = [
  {
    key: 'frequency',
    label: 'A frequency',
    upstream: true,
    current: (station) =>
      station.frequencies.length
        ? station.frequencies
            .map(
              (frequency) =>
                `${frequency.khz} kHz ${frequency.mode}` +
                `${frequency.timeOfDay ? ` (${frequency.timeOfDay})` : ''}` +
                `, confirmed ${frequency.lastConfirmed}${frequency.disputed ? ', disputed' : ''}`,
            )
            .join('; ')
        : 'none recorded',
  },
  {
    key: 'schedule',
    label: 'A transmission time',
    upstream: true,
    current: (station) =>
      station.schedules.length
        ? `${station.schedules.length} slots, e.g. ${station.schedules[0]!.rrule} — ` +
          `${describeScheduleKhz(station.schedules[0]!, new Date())}`
        : 'none recorded',
  },
  {
    key: 'status',
    label: 'Whether it is still on the air',
    upstream: true,
    current: (station) =>
      `${station.tier}${station.lastConfirmed ? `, last confirmed ${station.lastConfirmed}` : ', never confirmed'}`,
  },
  {
    key: 'operator',
    label: 'Who operates it',
    upstream: true,
    current: (station) => station.operator,
  },
  {
    key: 'site',
    label: 'Where it transmits from',
    upstream: false,
    current: (station) =>
      station.sites.length
        ? station.sites.map((site) => `${site.name} (${site.status})`).join('; ')
        : 'none recorded',
  },
  {
    key: 'other',
    label: 'Something else',
    upstream: false,
    current: () => '',
  },
];

/** The issue body, as markdown, with everything a maintainer needs to act without the app. */
export function issueBody(
  station: Station,
  field: Field,
  proposed: string,
  sourceUrl: string,
): string {
  const current = field.current(station);

  return [
    `**Station:** ${station.enigmaId}${station.name === station.enigmaId ? '' : ` ${station.name}`}`,
    `**Field:** ${field.label}`,
    current ? `**Currently recorded:** ${current}` : '',
    `**Should be:** ${proposed.trim()}`,
    `**Source:** ${sourceUrl.trim()}`,
    '',
    '---',
    '',
    'Reported from Project Echo.',
  ]
    .filter((line) => line !== '')
    .join('\n');
}

export function issueUrl(
  station: Station,
  field: Field,
  proposed: string,
  sourceUrl: string,
): string {
  const params = new URLSearchParams({
    title: `${station.enigmaId}: ${field.label.toLowerCase()}`,
    body: issueBody(station, field, proposed, sourceUrl),
    labels: 'data',
  });
  return `${REPOSITORY}/issues/new?${params.toString()}`;
}

export function openCorrection(station: Station): Sheet {
  const sheet = openSheet(
    `Report a correction to ${station.enigmaId}`,
    'This opens a prefilled issue on the repository. Nothing is sent from here.',
    undefined,
  );

  sheet.body.innerHTML = `
    <form class="echo-form echo-correction">
      <label>What is wrong
        <select name="field">
          ${FIELDS.map(
            (field) => `<option value="${esc(field.key)}">${esc(field.label)}</option>`,
          ).join('')}
        </select>
      </label>
      <p class="echo-correction__current"></p>
      <label>What it should be
        <textarea name="proposed" rows="3" placeholder="4625 kHz USB, still active"></textarea>
      </label>
      <label>Source
        <input name="source" type="url" placeholder="https://priyom.org/..." />
      </label>
      <p class="echo-correction__note">
        Every fact in this archive carries a source, and a correction needs one too —
        otherwise it cannot be acted on. A page, a newsletter or a logged reception all
        work.
      </p>
      <p class="echo-correction__upstream"></p>
      <div class="echo-sheet__actions">
        ${button({ label: 'Open the issue', variant: 'primary', name: 'submit' })}
        ${button({ label: 'Copy the report', name: 'copy' })}
      </div>
      <p class="echo-correction__status" role="status" aria-live="polite"></p>
    </form>
  `;

  const form = sheet.body.querySelector<HTMLFormElement>('form')!;
  const select = form.elements.namedItem('field') as HTMLSelectElement;
  const proposed = form.elements.namedItem('proposed') as HTMLTextAreaElement;
  const source = form.elements.namedItem('source') as HTMLInputElement;
  const currentLine = form.querySelector<HTMLElement>('.echo-correction__current')!;
  const upstreamLine = form.querySelector<HTMLElement>('.echo-correction__upstream')!;
  const status = form.querySelector<HTMLElement>('.echo-correction__status')!;

  const chosen = (): Field => FIELDS.find((field) => field.key === select.value) ?? FIELDS[0]!;

  const renderField = (): void => {
    const field = chosen();
    const current = field.current(station);

    currentLine.textContent = current ? `Currently recorded: ${current}` : '';
    currentLine.hidden = current === '';

    // Most of this archive is Priyom's work. An error in their data is better fixed
    // there, where it reaches everyone rather than only this app.
    upstreamLine.hidden = !field.upstream;
    upstreamLine.innerHTML = field.upstream
      ? `This one came from Priyom.org. If their page is wrong too, reporting it in ` +
        `<strong>#priyom</strong> on Libera.Chat fixes it for everyone, not only here.`
      : '';
  };

  /** Both actions need the same two fields, so they refuse in the same way. */
  const validate = (): { field: Field; text: string; url: string } | null => {
    const text = proposed.value.trim();
    const url = source.value.trim();

    if (!text) {
      status.textContent = 'Say what it should be.';
      return null;
    }
    if (!isSafeUrl(url)) {
      status.textContent = 'A source is required, and has to be an http or https address.';
      return null;
    }
    status.textContent = '';
    return { field: chosen(), text, url };
  };

  select.addEventListener('change', renderField);
  renderField();

  form.addEventListener('submit', (event) => event.preventDefault());

  form.addEventListener('click', (event) => {
    const target = event.target as HTMLElement;

    if (target.closest('[name="submit"]')) {
      const valid = validate();
      if (!valid) return;
      window.open(issueUrl(station, valid.field, valid.text, valid.url), '_blank', 'noreferrer');
      return;
    }

    if (target.closest('[name="copy"]')) {
      const valid = validate();
      if (!valid) return;
      const text = issueBody(station, valid.field, valid.text, valid.url);
      void navigator.clipboard
        ?.writeText(text)
        .then(() => (status.textContent = 'Copied. Paste it wherever suits — an email, or #priyom.'))
        .catch(() => (status.textContent = 'Could not copy. Select the text above instead.'));
    }
  });

  return sheet;
}
