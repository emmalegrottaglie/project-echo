/**
 * Scrolling spectrogram over a circular buffer.
 *
 * The naive version of this — write each row at `y = cursor` on a canvas the height of
 * the viewport, then `translateY(-cursor)` — scrolls the wrong way and tears at every
 * wrap, because the newest row ends up directly above the oldest.
 *
 * The fix is a canvas of height `2 * VIEWPORT_ROWS` with every row written twice, at
 * `y = cursor` and `y = cursor + VIEWPORT_ROWS`. The window of `VIEWPORT_ROWS`
 * consecutive rows ending at the cursor is then always contiguous somewhere on the
 * canvas, so the transform never crosses the wrap. Cost stays at one row of painting
 * per frame — two one-pixel blits — rather than a full-canvas `drawImage`.
 *
 * See docs/PLAN.md §2.
 */

const VIEWPORT_ROWS = 320;
const TARGET_FPS = 22;

/**
 * Inferno-like ramp. A perceptually ordered map is not decoration here: on a hue ramp
 * a mid-amplitude pulse can read as louder than a strong one, which makes the
 * waterfall lie about the marker.
 */
const COLORMAP: ReadonlyArray<readonly [number, number, number]> = [
  [0, 0, 4],
  [31, 12, 72],
  [85, 15, 109],
  [136, 34, 106],
  [186, 54, 85],
  [227, 89, 51],
  [249, 140, 10],
  [249, 201, 50],
  [252, 255, 164],
];

function colorFor(value: number): readonly [number, number, number] {
  const scaled = (value / 255) * (COLORMAP.length - 1);
  const low = Math.floor(scaled);
  const high = Math.min(low + 1, COLORMAP.length - 1);
  const frac = scaled - low;
  const a = COLORMAP[low]!;
  const b = COLORMAP[high]!;
  return [
    a[0] + (b[0] - a[0]) * frac,
    a[1] + (b[1] - a[1]) * frac,
    a[2] + (b[2] - a[2]) * frac,
  ];
}

export class Waterfall {
  private readonly canvas: HTMLCanvasElement;
  private readonly context: CanvasRenderingContext2D;
  private readonly row: ImageData;
  private readonly bins: Uint8Array<ArrayBuffer>;

  private cursor = 0;
  private frame = 0;
  private lastPaint = 0;
  private running = false;

  /**
   * Called once per painted row with the row's timestamp and its peak bin on a 0–1
   * scale. The marker detector consumes this rather than reading the analyser on a
   * loop of its own: the frames are already being fetched here, and a second timer
   * would sample the same data at a different cadence for no gain.
   */
  constructor(
    viewport: HTMLElement,
    private readonly analyser: AnalyserNode,
    private readonly visibleBins: number,
    private readonly onRow?: (atMs: number, peak: number) => void,
  ) {
    this.canvas = document.createElement('canvas');
    this.canvas.width = visibleBins;
    this.canvas.height = VIEWPORT_ROWS * 2;
    this.canvas.className = 'waterfall-canvas';

    const context = this.canvas.getContext('2d', { alpha: false });
    if (!context) throw new Error('2D canvas context unavailable');
    this.context = context;

    this.row = context.createImageData(visibleBins, 1);
    this.bins = new Uint8Array(analyser.frequencyBinCount);

    viewport.style.height = `${VIEWPORT_ROWS}px`;
    viewport.replaceChildren(this.canvas);

    // requestAnimationFrame already throttles in a hidden tab, but the audio graph and
    // the analyser do not, so stop explicitly and resume from the existing cursor.
    document.addEventListener('visibilitychange', this.onVisibilityChange);
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.frame = requestAnimationFrame(this.tick);
  }

  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.frame);
  }

  destroy(): void {
    this.stop();
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
  }

  private onVisibilityChange = (): void => {
    if (document.hidden) this.stop();
    else this.start();
  };

  private tick = (now: number): void => {
    if (!this.running) return;
    this.frame = requestAnimationFrame(this.tick);

    // A marker pulsing 25–50 times a minute needs nothing near 60 fps, and the row
    // rate is what sets the waterfall's vertical time scale anyway.
    if (now - this.lastPaint < 1000 / TARGET_FPS) return;
    this.lastPaint = now;

    this.analyser.getByteFrequencyData(this.bins);
    this.paintRow();

    if (this.onRow) {
      let peak = 0;
      for (let x = 0; x < this.visibleBins; x++) {
        if (this.bins[x]! > peak) peak = this.bins[x]!;
      }
      this.onRow(now, peak / 255);
    }
  };

  private paintRow(): void {
    const pixels = this.row.data;
    for (let x = 0; x < this.visibleBins; x++) {
      const [r, g, b] = colorFor(this.bins[x]!);
      const offset = x * 4;
      pixels[offset] = r;
      pixels[offset + 1] = g;
      pixels[offset + 2] = b;
      pixels[offset + 3] = 255;
    }

    this.context.putImageData(this.row, 0, this.cursor);
    this.context.putImageData(this.row, 0, this.cursor + VIEWPORT_ROWS);

    this.cursor = (this.cursor + 1) % VIEWPORT_ROWS;
    this.canvas.style.transform = `translateY(-${this.cursor}px)`;
  }
}
