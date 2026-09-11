import { describe, expect, it } from 'vitest';
import { worldMap, type MapReceiver } from '../src/worldmap';
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
