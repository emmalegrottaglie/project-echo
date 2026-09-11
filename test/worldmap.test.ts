import { describe, expect, it } from 'vitest';
import { worldMap, type MapReceiver } from '../src/worldmap';

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
