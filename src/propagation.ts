/**
 * Propagation overlay.
 *
 * A shortwave station is only audible when the ionosphere supports the path, so
 * "nothing on 4625 kHz" usually means the band is shut, not that the station is off.
 * Showing the maximum usable frequency next to each listed frequency answers that
 * before the user files it as a bug.
 *
 * Data is prop.kc2g.com's MOF/LOF map: IRI-2016 conditioned on live ionosonde
 * observations from GIRO and NOAA, regenerated every five minutes.
 *
 * The map is fetched as an `<img>` rather than through `fetch`. An image element is
 * not subject to the cross-origin read restrictions that would otherwise require the
 * upstream service to send `Access-Control-Allow-Origin`, which it does not, and Phase
 * 1 has no server to proxy through. The tradeoff is that the numbers stay in the
 * picture — the app cannot compare a frequency against the MUF programmatically until
 * there is a backend, so the comparison is left to the reader.
 */

const REFRESH_MS = 5 * 60 * 1000;

export const ATTRIBUTION_URL = 'https://prop.kc2g.com/';

export function mapUrl(grid: string, metric: 'mof_sp' | 'lof_sp' = 'mof_sp'): string {
  const params = new URLSearchParams({ grid: grid.toLowerCase(), metric });
  return `https://prop.kc2g.com/api/moflof.svg?${params.toString()}`;
}

/**
 * Renders the map into `container` and keeps it current, no faster than the source
 * regenerates. Returns a teardown function.
 */
export function mountPropagation(container: HTMLElement, grid: string): () => void {
  const image = document.createElement('img');
  image.alt = `Maximum usable frequency map centred on grid ${grid.toUpperCase()}`;
  image.className = 'propagation-map';
  image.loading = 'lazy';

  const refresh = (): void => {
    // The URL is cache-keyed by the browser, so a changing parameter is what makes the
    // five-minute regeneration visible.
    image.src = `${mapUrl(grid)}&t=${Date.now()}`;
  };

  refresh();
  container.replaceChildren(image);
  const timer = window.setInterval(refresh, REFRESH_MS);

  return () => {
    window.clearInterval(timer);
    image.remove();
  };
}
