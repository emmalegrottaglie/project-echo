/**
 * The design system's components, in this codebase's idiom.
 *
 * "Project Echo Design System" ships them as cosmetic React implementations; its
 * HANDOFF.md is explicit that the JSX is a design reference and the task is to
 * recreate it here, in vanilla TypeScript with `innerHTML` strings — not to introduce
 * a framework. So each component below is either a function returning markup or, where
 * it owns behaviour, a small factory returning an element and a teardown.
 *
 * The styling lives in `src/style.css` under `.echo-*` class names rather than inline,
 * which is the one deliberate departure from the reference: inline styles per row
 * across 141 archive rows would defeat the performance budget the same document sets.
 */

import { isSafeUrl } from './url';

/** Escapes text for interpolation into markup. */
export function esc(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export type Tone = 'neutral' | 'live' | 'danger' | 'ok';

/**
 * A URL fit to interpolate into an `href`.
 *
 * Station source URLs now arrive as data rather than as compiled-in literals, and four
 * places in this app drop them straight into an anchor. `src/data/schema.ts` already
 * rejects a dataset containing anything but http or https, so this never fires in
 * normal operation — it is here because a rendering helper that trusts its input is one
 * refactor away from being the hole.
 */
export function safeUrl(value: string): string {
  return isSafeUrl(value) ? esc(value) : '#';
}

/* ------------------------------------------------------------------ core ----- */

export interface ButtonOptions {
  label: string;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'md' | 'lg';
  name?: string;
  disabled?: boolean;
  full?: boolean;
  hidden?: boolean;
  type?: 'button' | 'submit';
}

export function button(options: ButtonOptions): string {
  const classes = [
    'echo-button',
    `echo-button--${options.variant ?? 'secondary'}`,
    options.size === 'lg' ? 'echo-button--lg' : '',
    options.full ? 'echo-button--full' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    `<button class="${classes}" type="${options.type ?? 'button'}"` +
    (options.name ? ` name="${options.name}"` : '') +
    (options.disabled ? ' disabled' : '') +
    (options.hidden ? ' hidden' : '') +
    `>${esc(options.label)}</button>`
  );
}

export function searchField(name: string, placeholder: string): string {
  return `<input class="echo-search" type="search" name="${name}" placeholder="${esc(placeholder)}" />`;
}

export interface Segment {
  value: string;
  label: string;
}

export function segmented(name: string, segments: Segment[], selected: string): string {
  const buttons = segments
    .map(
      (segment) =>
        `<button class="echo-segment" type="button" role="tab" data-value="${esc(segment.value)}"` +
        ` aria-selected="${segment.value === selected}">${esc(segment.label)}</button>`,
    )
    .join('');
  return `<div class="echo-segmented" role="tablist" data-name="${name}">${buttons}</div>`;
}

/** Directory-load placeholder. Loops only while fetching, never while audio streams. */
export function skeleton(rows = 3): string {
  const row = '<div class="echo-skeleton-row"><span></span><span></span></div>';
  return `<div class="echo-skeleton" aria-hidden="true">${row.repeat(rows)}</div>`;
}

/* ------------------------------------------------------------- instrument ----- */

/**
 * The live-tier dot. Its period is the station's own published marker period — 2.4 s
 * for The Buzzer, 1.2 s for The Pip — so the dot beats at the rate the transmitter
 * does. Opacity only: scaling a 6 px dot alongside a 22 fps waterfall is visible jank
 * on mid-range Android.
 */
export function livePulse(periodSec: number | null, size = 6): string {
  const period = periodSec ?? 2.4;
  return (
    `<span class="echo-pulse" aria-hidden="true"` +
    ` style="--pulse-period:${period}s;--pulse-size:${size}px"></span>`
  );
}

/** A short uppercase word carrying a data caveat. Never a coloured badge alone. */
export function flag(word: string, tone: 'accent' | 'dim' | 'danger' = 'accent'): string {
  return `<span class="echo-flag echo-flag--${tone}">${esc(word)}</span>`;
}

export interface RowOptions {
  label: string;
  value: string;
  meta?: string | null;
  live?: boolean;
  periodSec?: number | null;
  flagWord?: string | null;
  name: string;
}

/** One truncating line with a chevron opening its sheet: receiver, and station. */
export function pickerRow(options: RowOptions): string {
  return (
    `<button class="echo-picker-row" type="button" name="${options.name}">` +
    `<span class="echo-picker-row__text">` +
    `<span class="echo-picker-row__label">${esc(options.label)}</span>` +
    `<span class="echo-picker-row__value">` +
    (options.live ? livePulse(options.periodSec ?? null, 8) : '') +
    esc(options.value) +
    (options.meta ? `<span class="echo-dim">${esc(options.meta)}</span>` : '') +
    (options.flagWord ? flag(options.flagWord) : '') +
    `</span></span>` +
    `<span class="echo-chevron" aria-hidden="true">›</span>` +
    `</button>`
  );
}

/**
 * The status line: an ARIA live region that crossfades on change, because movement
 * would fight the announcement. This is where "connected but no audio reached the
 * analyser" gets said in plain words.
 */
export function statusLine(message: string, tone: Tone = 'neutral', action = ''): string {
  return (
    `<div class="echo-status echo-status--${tone}" role="status" aria-live="polite">` +
    `<span class="echo-status__message">${esc(message)}</span>${action}</div>`
  );
}

/**
 * The spectrogram viewport: 320 rows, full bleed, square corners, newest row at the
 * bottom, with a kHz offset scale down the leading edge.
 *
 * The canvas inside is created by `Waterfall` in `src/waterfall.ts` — the design
 * bundle's `WaterfallPanel.jsx` is a static mock and explicitly must not replace it.
 */
export function waterfallPanel(): string {
  const scale = ['3k', '2k', '1k', '0']
    .map((label) => `<span>${label}</span>`)
    .join('');
  return (
    `<div class="echo-waterfall">` +
    `<div class="waterfall-viewport"></div>` +
    `<div class="echo-waterfall__scale" aria-hidden="true">${scale}</div>` +
    `<p class="echo-waterfall__empty">no signal yet</p>` +
    `</div>`
  );
}

export type DetectorVisualState = 'idle' | 'searching' | 'detected' | 'absent';

const DETECTOR_GLYPH: Record<DetectorVisualState, string> = {
  idle: '···',
  searching: '≈',
  detected: '●',
  absent: '—',
};

/**
 * The detector strip: a 2 px track over a text row.
 *
 * This is the one piece of live interpretation on the screen, and what makes the app
 * usable by someone who cannot see the spectrogram at all — which raises its
 * importance far above its size. The wording comes from `describe()` in
 * `src/detector.ts`; it is not rewritten here.
 */
export function detectorStrip(state: DetectorVisualState, text: string): string {
  return (
    `<div class="echo-detector echo-detector--${state}" role="status" aria-live="polite">` +
    `<div class="echo-detector__track"><span class="echo-detector__bar"></span></div>` +
    `<div class="echo-detector__text">` +
    `<span class="echo-detector__glyph" aria-hidden="true">${DETECTOR_GLYPH[state]}</span>` +
    `<span class="echo-detector__line">${esc(text)}</span>` +
    `</div></div>`
  );
}

/**
 * Fixed above the tab bar so it never scrolls away: the first tap on Connect is what
 * creates the AudioContext, so this control is load-bearing.
 *
 * Connect and Stop are one control that swaps role, and it must not resize — a moving
 * primary button under a thumb is a mis-tap.
 */
export function transportBar(showSynthetic: boolean): string {
  return (
    `<div class="echo-transport">` +
    button({ label: 'Connect', variant: 'primary', size: 'lg', name: 'connect', full: true }) +
    button({ label: 'Demo', size: 'lg', name: 'synthetic', hidden: !showSynthetic }) +
    `</div>`
  );
}

/* ---------------------------------------------------------------- archive ----- */

export function tierHeader(label: string, count: number): string {
  return (
    `<div class="echo-tier-header"><span>${esc(label)}</span><span>${count}</span></div>`
  );
}

export interface StationRowOptions {
  designator: string;
  name: string;
  operator: string;
  tier: string;
  periodSec: number | null;
  disputed: boolean;
}

/** One of 141 rows. Press feedback is opacity only, instant, with no exit and no ripple. */
export function stationRow(options: StationRowOptions): string {
  return (
    `<button class="echo-station-row" type="button" data-id="${esc(options.designator)}">` +
    `<span class="echo-station-row__designator">${esc(options.designator)}` +
    (options.tier === 'live' ? livePulse(options.periodSec) : '') +
    `</span>` +
    `<span class="echo-station-row__name">${
      options.name === options.designator ? '' : esc(options.name)
    }</span>` +
    `<span class="echo-station-row__flag">${options.disputed ? 'disputed' : ''}</span>` +
    `<span class="echo-station-row__operator">${esc(options.operator)}</span>` +
    `</button>`
  );
}

export interface DefinitionItem {
  label: string;
  value: string;
}

export function definitionList(items: DefinitionItem[]): string {
  return (
    `<dl class="echo-dl">` +
    items
      .map((item) => `<dt>${esc(item.label)}</dt><dd>${esc(item.value)}</dd>`)
      .join('') +
    `</dl>`
  );
}

export interface GapLink {
  label: string;
  url: string;
  description?: string;
}

/**
 * An honest gap. 112 of 141 stations have sourced identity and status but no imported
 * detail; several views have no data yet; three features vanish without the server.
 * All of those read as a stated gap with a route onward — never a broken page, and
 * never an empty table pretending the station has no frequencies.
 */
export function gapNotice(title: string, body: string, links: GapLink[] = []): string {
  const list = links.length
    ? `<ul class="echo-gap__links">` +
      links
        .map(
          (link) =>
            `<li><a href="${safeUrl(link.url)}" target="_blank" rel="noreferrer">${esc(link.label)}</a>` +
            (link.description ? `<span>${esc(link.description)}</span>` : '') +
            `</li>`,
        )
        .join('') +
      `</ul>`
    : '';

  return (
    `<section class="echo-gap">` +
    `<h4 class="echo-gap__title">${esc(title)}</h4>` +
    `<p class="echo-gap__body">${esc(body)}</p>${list}</section>`
  );
}

/* --------------------------------------------------------------- schedule ----- */

/** 44 px switch replacing the desktop build's glyph button. */
export function alertSwitch(on: boolean, slot: string, disabled = false): string {
  return (
    `<button class="echo-switch" type="button" role="switch" data-slot="${esc(slot)}"` +
    ` aria-checked="${on}" aria-label="Alert before this window"${disabled ? ' disabled' : ''}>` +
    `<span class="echo-switch__track"><span class="echo-switch__knob"></span></span>` +
    `</button>`
  );
}

/* ------------------------------------------------------------------ sheet ----- */

export interface Sheet {
  element: HTMLElement;
  body: HTMLElement;
  close(): void;
}

/**
 * A bottom sheet.
 *
 * The scrim is deliberately translucent — 72 % — so the waterfall stays visible
 * behind it. Dismiss on scrim tap, on the close control, and on Escape; the
 * drag-to-dismiss gesture in the design bundle is listed there as documented but not
 * implemented, and is not implemented here either.
 */
export function openSheet(title: string, note: string, onClose?: () => void): Sheet {
  const element = document.createElement('div');
  element.className = 'echo-sheet-host';
  element.innerHTML =
    `<div class="echo-scrim" data-dismiss></div>` +
    `<section class="echo-sheet" role="dialog" aria-modal="true" aria-label="${esc(title)}">` +
    `<div class="echo-sheet__handle" data-dismiss><span></span></div>` +
    `<header class="echo-sheet__header">` +
    `<h2>${esc(title)}</h2>` +
    (note ? `<p>${esc(note)}</p>` : '') +
    `</header>` +
    `<div class="echo-sheet__body"></div>` +
    `</section>`;

  const close = (): void => {
    document.removeEventListener('keydown', onKeydown);
    element.remove();
    onClose?.();
  };

  function onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') close();
  }

  element.addEventListener('click', (event) => {
    if ((event.target as HTMLElement).closest('[data-dismiss]')) close();
  });
  document.addEventListener('keydown', onKeydown);

  document.body.appendChild(element);

  return {
    element,
    body: element.querySelector<HTMLElement>('.echo-sheet__body')!,
    close,
  };
}
