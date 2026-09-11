import { esc } from './ui';
import { WORLD_ATTRIBUTION, WORLD_PATHS } from './data/world';

/**
 * A world map of public receivers, as inline SVG.
 *
 * This answers a question the sorted list cannot. The list answers "which receiver hears
 * this frequency best right now", which is what the SNR ordering is for. The map answers
 * "which receiver gives me a *different path*" — and on shortwave that is a real
 * question, because whether a signal arrives at all depends on the ionosphere between
 * the transmitter and the receiver, not on the receiver's own quality. Two nodes with
 * identical SNR figures on opposite sides of Europe are not interchangeable.
 *
 * It also scales where the list does not: the directory returns 776 receivers for
 * 4625 kHz and the sheet renders 50 of them, because a list of 776 rows is unusable. All
 * 776 are perfectly legible as dots.
 *
 * Equirectangular, in a `0 0 360 180` viewBox, so projecting a point is `lon + 180` and
 * `90 - lat` with no scale factor. Land comes from `src/data/world.ts`.
 *
 * Deliberately `aria-hidden`: fifty-plus focusable dots would bury the tab order, and
 * the list underneath already carries every receiver with its name, channels and SNR.
 * The map is a second way to reach the same rows, not the only way — which is also why
 * each dot carries the same `data-host` attribute the list rows use, so one delegated
 * click handler serves both.
 */

export interface MapReceiver {
  host: string;
  location: string;
  name: string;
  gps: [number, number] | null;
  snr: number | null;
}

/** Dot radius in viewBox units. A degree of longitude at the equator is one unit. */
const MIN_RADIUS = 1.1;
const MAX_RADIUS = 2.6;

/**
 * Reported SNR runs roughly 0–60 dB on this list. The radius carries it because area
 * reads as magnitude at a glance where a colour ramp would need a legend, and the
 * spectrogram already owns the one colour ramp this app is allowed.
 */
function radius(snr: number | null): number {
  if (snr === null) return MIN_RADIUS;
  const scaled = Math.max(0, Math.min(1, snr / 60));
  return MIN_RADIUS + scaled * (MAX_RADIUS - MIN_RADIUS);
}

export interface WorldMapOptions {
  /** Host of the receiver to mark as chosen, drawn last so it is never hidden. */
  selectedHost?: string | null;
  /** Maidenhead-derived position of the user's saved receiver, if there is one. */
  here?: [number, number] | null;
}

export function worldMap(receivers: readonly MapReceiver[], options: WorldMapOptions = {}): string {
  const placed = receivers.filter(
    (receiver): receiver is MapReceiver & { gps: [number, number] } => receiver.gps !== null,
  );

  const land = WORLD_PATHS.map((path) => `<path d="${path}" />`).join('');

  const dots = placed
    .map((receiver) => {
      const [lat, lon] = receiver.gps;
      const chosen = receiver.host === options.selectedHost;
      return {
        chosen,
        markup:
          `<circle class="echo-worldmap__dot${chosen ? ' is-selected' : ''}"` +
          ` cx="${(lon + 180).toFixed(1)}" cy="${(90 - lat).toFixed(1)}"` +
          ` r="${radius(receiver.snr).toFixed(2)}"` +
          ` data-host="${esc(receiver.host)}"><title>${esc(
            receiver.location || receiver.name,
          )}${receiver.snr === null ? '' : ` — SNR ${receiver.snr}`}</title></circle>`,
      };
    })
    // The chosen receiver goes last so a crowded region cannot paint over it.
    .sort((a, b) => Number(a.chosen) - Number(b.chosen))
    .map((dot) => dot.markup)
    .join('');

  const unplaced = receivers.length - placed.length;

  return (
    `<figure class="echo-worldmap">` +
    `<svg viewBox="0 0 360 180" preserveAspectRatio="xMidYMid meet" role="img"` +
    ` aria-label="World map of ${placed.length} public receivers">` +
    `<g class="echo-worldmap__land" aria-hidden="true">${land}</g>` +
    `<g class="echo-worldmap__dots">${dots}</g>` +
    `</svg>` +
    `<figcaption>${placed.length} of ${receivers.length} receivers publish a position` +
    (unplaced > 0 ? `; ${unplaced} are in the list below but not on the map` : '') +
    `. Dot size is reported SNR. Coastlines: ${esc(WORLD_ATTRIBUTION)}, public domain.` +
    `</figcaption>` +
    `</figure>`
  );
}
