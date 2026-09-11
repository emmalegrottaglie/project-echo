import { describe, expect, it } from 'vitest';
import { greatCirclePath, worldMap, type MapReceiver } from '../src/worldmap';
import type { Site } from '../src/types';

/**
 * The receiver map.
 *
 * Everything it draws comes from a third-party directory fetched at runtime, so the
 * escaping cases below are the ones that matter most: a host or a location carrying a
 * quote would otherwise break out of the attribute it is interpolated into.
 */

function receiver(overrides: Partial<MapReceiver> = {}): MapReceiver {
  return {
    host: 'example.proxy.kiwisdr.com:8073',
    location: 'Somewhere',
    name: 'Example receiver',
    gps: [0, 0],
    snr: 30,
    ...overrides,
  };
}

/** Pulls the cx/cy off the nth circle, so the projection can be checked directly. */
function positions(markup: string): Array<{ cx: number; cy: number }> {
  return [...markup.matchAll(/<circle[^>]*cx="([-\d.]+)" cy="([-\d.]+)"/g)].map((match) => ({
    cx: Number(match[1]),
    cy: Number(match[2]),
  }));
}

describe('projection', () => {
  it('puts the origin at the centre of the viewBox', () => {
    // Equirectangular into `0 0 360 180`: lon + 180, 90 - lat.
    expect(positions(worldMap([receiver({ gps: [0, 0] })]))).toEqual([{ cx: 180, cy: 90 }]);
  });

  it('places the corners of the world at the corners of the box', () => {
    const corners = worldMap([
      receiver({ host: 'nw', gps: [90, -180] }),
      receiver({ host: 'se', gps: [-90, 180] }),
    ]);
    expect(positions(corners)).toEqual([
      { cx: 0, cy: 0 },
      { cx: 360, cy: 180 },
    ]);
  });

  it('places a real receiver where it belongs', () => {
    // Naro-Fominsk, roughly: 55.4 N, 36.7 E — right of centre, above the equator.
    const [dot] = positions(worldMap([receiver({ gps: [55.4, 36.7] })]));
    expect(dot?.cx).toBeCloseTo(216.7, 1);
    expect(dot?.cy).toBeCloseTo(34.6, 1);
  });
});

describe('what it draws', () => {
  it('draws the land outline once, whatever the receivers are', () => {
    const paths = (markup: string): number => (markup.match(/<path /g) ?? []).length;
    expect(paths(worldMap([]))).toBe(paths(worldMap([receiver(), receiver({ host: 'b' })])));
    expect(paths(worldMap([]))).toBeGreaterThan(100);
  });

  it('leaves out receivers with no position and says how many', () => {
    const markup = worldMap([
      receiver({ host: 'placed' }),
      receiver({ host: 'unplaced', gps: null }),
    ]);
    expect(positions(markup)).toHaveLength(1);
    expect(markup).toContain('1 of 2 receivers publish a position');
    expect(markup).toContain('1 are in the list below but not on the map');
  });

  it('says nothing about unplaced receivers when there are none', () => {
    const markup = worldMap([receiver()]);
    expect(markup).toContain('1 of 1 receivers publish a position');
    expect(markup).not.toContain('not on the map');
  });

  it('sizes a dot by reported SNR, and gives an unknown one the floor', () => {
    const radii = (snr: number | null): number =>
      Number(/ r="([\d.]+)"/.exec(worldMap([receiver({ snr })]))?.[1]);

    expect(radii(60)).toBeGreaterThan(radii(0));
    expect(radii(null)).toBe(radii(0));
  });

  it('draws the selected receiver last so a crowded region cannot bury it', () => {
    const markup = worldMap(
      [
        receiver({ host: 'a', gps: [50, 10] }),
        receiver({ host: 'chosen', gps: [51, 11] }),
        receiver({ host: 'c', gps: [52, 12] }),
      ],
      { selectedHost: 'chosen' },
    );

    const hosts = [...markup.matchAll(/data-host="([^"]+)"/g)].map((match) => match[1]);
    expect(hosts[hosts.length - 1]).toBe('chosen');
    expect(markup).toContain('echo-worldmap__dot is-selected');
  });

  it('carries the same data-host the list rows use, so one handler serves both', () => {
    expect(worldMap([receiver({ host: 'node.example:8073' })])).toContain(
      'data-host="node.example:8073"',
    );
  });
});

/**
 * Hosts and locations come from rx.linkfanel.net, which is neither ours nor validated
 * upstream. They land in an attribute and in a `<title>`.
 */
describe('untrusted directory strings', () => {
  it('escapes a host that tries to break out of its attribute', () => {
    const markup = worldMap([receiver({ host: '" onclick="alert(1)' })]);
    expect(markup).not.toContain('onclick="alert(1)"');
    expect(markup).toContain('&quot; onclick=&quot;alert(1)');
  });

  it('escapes a location that tries to open a tag', () => {
    const markup = worldMap([receiver({ location: '<script>alert(1)</script>' })]);
    expect(markup).not.toContain('<script>');
    expect(markup).toContain('&lt;script&gt;');
  });
});

/**
 * Transmitter sites. These are drawn because the path between transmitter and receiver
 * is what decides whether anything arrives — and there are several per station because
 * the sources disagree, which is a fact worth drawing rather than resolving.
 */
describe('transmitter sites', () => {
  const site = (overrides: Partial<Site> = {}): Site => ({
    name: 'Povarovo',
    lat: 56.08333,
    lon: 37.11028,
    status: 'former',
    lastConfirmed: '2026-09-11',
    sourceUrl: 'https://en.wikipedia.org/wiki/UVB-76',
    ...overrides,
  });

  it('draws nothing and says nothing when a station has no sourced position', () => {
    const markup = worldMap([receiver()], { sites: [] });
    // The group is always present; what must be absent is any mark inside it.
    expect(markup).not.toContain('echo-worldmap__site--');
    expect(markup).not.toContain('Crosses are transmitter sites');
  });

  it('draws one cross per site, marked with its status', () => {
    const markup = worldMap([receiver()], {
      sites: [
        site({ name: 'Kerro Massiv', status: 'confirmed' }),
        site({ name: 'Naro-Fominsk', status: 'claimed' }),
        site(),
      ],
    });
    expect((markup.match(/echo-worldmap__site /g) ?? []).length).toBe(3);
    expect(markup).toContain('echo-worldmap__site--confirmed');
    expect(markup).toContain('echo-worldmap__site--claimed');
    expect(markup).toContain('echo-worldmap__site--former');
  });

  it('names every site and its status in the caption', () => {
    const markup = worldMap([receiver()], {
      sites: [site({ name: 'Naro-Fominsk', status: 'claimed' })],
    });
    expect(markup).toContain('Naro-Fominsk (claimed)');
  });

  it('projects a site the same way as a receiver', () => {
    // Povarovo: 56.08333 N, 37.11028 E.
    const markup = worldMap([], { sites: [site()] });
    const [, x, y] = /<path d="M([\d.]+) ([\d.]+)h/.exec(markup) ?? [];
    // The cross is centred on the site, so the arm starts 2.4 to its left.
    expect(Number(x) + 2.4).toBeCloseTo(37.11028 + 180, 1);
    expect(Number(y)).toBeCloseTo(90 - 56.08333, 1);
  });

  it('escapes a site name', () => {
    const markup = worldMap([], { sites: [site({ name: '<script>alert(1)</script>' })] });
    expect(markup).not.toContain('<script>');
  });
});

/**
 * The great-circle path.
 *
 * A straight line on an equirectangular map is not the route a signal takes, and the map
 * exists to show which path you are listening over. These pin the two things that make
 * the difference visible: the poleward bulge, and the seam.
 */
describe('greatCirclePath', () => {
  /** Every point on the emitted path, back in viewBox coordinates. */
  function points(paths: string[]): Array<[number, number]> {
    return paths.flatMap((d) =>
      [...d.matchAll(/[ML]([-\d.]+) ([-\d.]+)/g)].map(
        (m) => [Number(m[1]), Number(m[2])] as [number, number],
      ),
    );
  }

  it('draws nothing between a point and itself', () => {
    expect(greatCirclePath([55, 37], [55, 37])).toEqual([]);
  });

  it('follows the equator flat, because there the great circle is the straight line', () => {
    const [path] = greatCirclePath([0, -40], [0, 40]);
    const ys = points([path!]).map(([, y]) => y);
    expect(Math.max(...ys) - Math.min(...ys)).toBeLessThan(0.01);
  });

  it('runs straight along a meridian', () => {
    const [path] = greatCirclePath([10, 25], [70, 25]);
    const xs = points([path!]).map(([x]) => x);
    expect(Math.max(...xs) - Math.min(...xs)).toBeLessThan(0.01);
  });

  it('bulges poleward, which is the whole reason for not drawing a line', () => {
    // Moscow to Seattle: the short way is over the Arctic, well north of either end.
    const paths = greatCirclePath([55.75, 37.6], [47.6, -122.3]);
    const ys = points(paths).map(([, y]) => y);
    const northernmost = 90 - Math.min(...ys);

    expect(northernmost).toBeGreaterThan(55.75);
    expect(northernmost).toBeGreaterThan(70);
  });

  it('cuts the path at the antimeridian rather than streaking back across the map', () => {
    // Tokyo to Los Angeles crosses the Pacific seam.
    const paths = greatCirclePath([35.7, 139.7], [34.05, -118.24]);
    expect(paths.length).toBe(2);

    for (const d of paths) {
      const xs = points([d]).map(([x]) => x);
      // No single segment may jump the full width of the map.
      for (let i = 1; i < xs.length; i += 1) {
        expect(Math.abs(xs[i]! - xs[i - 1]!)).toBeLessThan(180);
      }
    }
  });

  it('starts and ends where it was asked to', () => {
    const paths = greatCirclePath([56.08, 37.11], [48.85, 2.35]);
    const all = points(paths);
    expect(all[0]).toEqual([37.11 + 180, 90 - 56.08]);
    expect(all[all.length - 1]).toEqual([2.35 + 180, 90 - 48.85]);
  });
});

describe('when the map draws a path at all', () => {
  const site = (status: Site['status'] = 'confirmed'): Site => ({
    name: 'Kerro Massiv',
    lat: 60.31,
    lon: 30.28,
    status,
    lastConfirmed: '2026-09-11',
    sourceUrl: 'https://example.org/',
  });

  it('draws none until a receiver is chosen', () => {
    const markup = worldMap([receiver({ host: 'a', gps: [48.85, 2.35] })], { sites: [site()] });
    expect(markup).not.toContain('<path class="echo-worldmap__path"');
    expect(markup).not.toContain('great-circle path');
  });

  it('draws one from the chosen receiver to a working transmitter', () => {
    const markup = worldMap([receiver({ host: 'a', gps: [48.85, 2.35] })], {
      selectedHost: 'a',
      sites: [site()],
    });
    expect(markup).toContain('<path class="echo-worldmap__path"');
    expect(markup).toContain('great-circle path');
  });

  it('draws none to a transmitter that was abandoned', () => {
    // Povarovo stopped in 2010. A path to it is a route to nothing.
    const markup = worldMap([receiver({ host: 'a', gps: [48.85, 2.35] })], {
      selectedHost: 'a',
      sites: [site('former')],
    });
    expect(markup).not.toContain('<path class="echo-worldmap__path"');
  });
});
