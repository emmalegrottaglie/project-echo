import { esc } from './ui';
import type { Site } from './types';
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
  /**
   * Transmitter sites for the tuned station, drawn as crosses.
   *
   * This is what makes the map worth having rather than decorative: the thing that
   * decides whether a marker arrives is the ionosphere along the path between the
   * transmitter and the receiver, so seeing both is seeing the actual variable.
   */
  sites?: readonly Site[];
}

const RADIANS = Math.PI / 180;

/**
 * The great-circle path between two points, as SVG path data.
 *
 * A straight line on an equirectangular map is not the route a radio signal takes. The
 * short way from Moscow to a receiver in Oregon goes over the Arctic, and drawing it
 * flat would put it across Kazakhstan and the Pacific — a picture of the wrong path, on
 * a map whose only purpose is showing which path you are listening over.
 *
 * Interpolated by spherical linear interpolation and projected point by point, which is
 * the same arithmetic a navigator uses and is short enough not to want a library.
 *
 * Returns one path per segment. A route crossing the antimeridian has to be cut there:
 * a polyline whose longitude jumps from 179 to -179 would otherwise be drawn as a
 * horizontal streak straight back across the whole map.
 */
export function greatCirclePath(
  a: readonly [number, number],
  b: readonly [number, number],
  segments = 64,
): string[] {
  const [lat1, lon1] = [a[0] * RADIANS, a[1] * RADIANS];
  const [lat2, lon2] = [b[0] * RADIANS, b[1] * RADIANS];

  const delta =
    2 *
    Math.asin(
      Math.sqrt(
        Math.sin((lat2 - lat1) / 2) ** 2 +
          Math.cos(lat1) * Math.cos(lat2) * Math.sin((lon2 - lon1) / 2) ** 2,
      ),
    );

  // The same point, or as near as makes no difference: there is no path to draw.
  if (!Number.isFinite(delta) || delta < 1e-9) return [];

  const points: Array<[number, number]> = [];
  for (let step = 0; step <= segments; step += 1) {
    const f = step / segments;
    const scaleA = Math.sin((1 - f) * delta) / Math.sin(delta);
    const scaleB = Math.sin(f * delta) / Math.sin(delta);

    const x = scaleA * Math.cos(lat1) * Math.cos(lon1) + scaleB * Math.cos(lat2) * Math.cos(lon2);
    const y = scaleA * Math.cos(lat1) * Math.sin(lon1) + scaleB * Math.cos(lat2) * Math.sin(lon2);
    const z = scaleA * Math.sin(lat1) + scaleB * Math.sin(lat2);

    points.push([
      Math.atan2(z, Math.sqrt(x * x + y * y)) / RADIANS,
      Math.atan2(y, x) / RADIANS,
    ]);
  }

  const paths: string[] = [];
  let run: string[] = [];

  points.forEach(([lat, lon], index) => {
    const previous = points[index - 1];
    // A jump of more than half the world is the seam, not a movement.
    if (previous && Math.abs(lon - previous[1]) > 180) {
      if (run.length > 1) paths.push(run.join(''));
      run = [];
    }
    run.push(`${run.length === 0 ? 'M' : 'L'}${(lon + 180).toFixed(2)} ${(90 - lat).toFixed(2)}`);
  });
  if (run.length > 1) paths.push(run.join(''));

  return paths;
}

/** A cross rather than a dot: a transmitter is not one more receiver. */
function siteMark(site: Site): string {
  const x = site.lon + 180;
  const y = 90 - site.lat;
  const arm = 2.4;
  return (
    `<g class="echo-worldmap__site echo-worldmap__site--${site.status}">` +
    `<path d="M${(x - arm).toFixed(1)} ${y.toFixed(1)}h${arm * 2}` +
    `M${x.toFixed(1)} ${(y - arm).toFixed(1)}v${arm * 2}" />` +
    `<title>${esc(site.name)} — ${site.status}</title>` +
    `</g>`
  );
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

  const sites = (options.sites ?? []).map(siteMark).join('');

  // Only from the chosen receiver, and only to a site that is not abandoned. Drawing a
  // path from all 786 would bury the map, and a path to a transmitter that stopped in
  // 2010 is a route to nothing.
  const chosen = placed.find((receiver) => receiver.host === options.selectedHost);
  const paths = chosen
    ? (options.sites ?? [])
        .filter((site) => site.status !== 'former')
        .flatMap((site) => greatCirclePath([site.lat, site.lon], chosen.gps))
        .map((d) => `<path class="echo-worldmap__path" d="${d}" />`)
        .join('')
    : '';
  const unplaced = receivers.length - placed.length;

  // Named in the caption because a cross with no explanation is a puzzle, and because
  // "claimed" and "former" are the whole point of drawing more than one.
  const siteNote = (options.sites ?? []).length
    ? ` Crosses are transmitter sites: ${(options.sites ?? [])
        .map((site) => `${site.name} (${site.status})`)
        .join(', ')}.`
    : '';

  return (
    `<figure class="echo-worldmap">` +
    `<svg viewBox="0 0 360 180" preserveAspectRatio="xMidYMid meet" role="img"` +
    ` aria-label="World map of ${placed.length} public receivers">` +
    `<g class="echo-worldmap__land" aria-hidden="true">${land}</g>` +
    `<g class="echo-worldmap__dots">${dots}</g>` +
    `<g class="echo-worldmap__paths" aria-hidden="true">${paths}</g>` +
    `<g class="echo-worldmap__sites">${sites}</g>` +
    `</svg>` +
    `<figcaption>${placed.length} of ${receivers.length} receivers publish a position` +
    (unplaced > 0 ? `; ${unplaced} are in the list below but not on the map` : '') +
    `. Dot size is reported SNR.${esc(siteNote)}` +
    (paths ? ' The arc is the great-circle path your receiver is listening over.' : '') +
    ` Coastlines: ${esc(WORLD_ATTRIBUTION)}, ` +
    `public domain.` +
    `</figcaption>` +
    `</figure>`
  );
}
