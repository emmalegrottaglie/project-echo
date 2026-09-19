import type { AudioSource } from './source';

/** Waits for the element to have loaded enough to play, or to fail trying. */
function loadNative(audio: HTMLAudioElement, url: string): Promise<void> {
  audio.src = url;
  return new Promise<void>((resolve, reject) => {
    audio.addEventListener('loadedmetadata', () => resolve(), { once: true });
    audio.addEventListener('error', () => reject(new Error(`could not load ${url}`)), {
      once: true,
    });
  });
}

/**
 * Audio from an HTTP stream — the relay, or the diagnostic recording.
 *
 * This is the one source that goes through a media element rather than a WebSocket, so
 * it is the one subject to the rule in docs/RESEARCH.md §4: a
 * `MediaElementAudioSourceNode` built from a cross-origin resource **outputs silence**.
 * Playback still works, the analyser reads zeros, and nothing throws or logs. Two things
 * follow, both implemented below:
 *
 *   - `crossOrigin = 'anonymous'` is set before any src is assigned, and the server must
 *     send `Access-Control-Allow-Origin` (it does, for `/stream/` and `/diagnostic/`);
 *   - with hls.js the source node is created only after the manifest has parsed and
 *     attached, because creating it earlier yields silence or an init failure.
 *
 * The caller's `hasSignal` check is what catches it when either of those regresses.
 *
 * `Hls.isSupported()`, not `canPlayType`, decides whether hls.js runs. Checked on a real
 * device (docs/PLATFORM_POLISH.md Phase D): Chromium's WebView answers "maybe" for
 * `application/vnd.apple.mpegurl` without ever actually decoding a multi-segment
 * playlist, and trusting that skipped hls.js on the one platform this app ships a
 * packaged build for. `Hls.isSupported()` checks for a real MediaSource Extensions
 * capability instead, which is what hls.js itself needs and does not lie about. Native
 * playback is now the fallback for engines hls.js declines on purpose — Safari, whose
 * own decoder is the better path — rather than the default everywhere else.
 */
export class RelaySource implements AudioSource {
  private audio: HTMLAudioElement | null = null;
  private node: MediaElementAudioSourceNode | null = null;
  private hls: { destroy(): void } | null = null;

  readonly silenceHint =
    'The stream played but no audio reached the analyser. If it is served from another ' +
    'origin it needs Access-Control-Allow-Origin, which is the one failure that looks ' +
    'exactly like a dead antenna.';

  constructor(
    private readonly url: string,
    readonly label: string,
  ) {}

  async start(context: AudioContext, destination: AudioNode): Promise<void> {
    const audio = new Audio();
    audio.crossOrigin = 'anonymous';
    audio.preload = 'auto';
    audio.loop = this.url.endsWith('.wav');
    this.audio = audio;

    if (this.url.endsWith('.m3u8')) {
      // Loaded on demand so a session that never plays the relay never pays for it.
      const { default: Hls } = await import('hls.js');

      if (Hls.isSupported()) {
        const hls = new Hls({ lowLatencyMode: true });
        this.hls = hls;

        await new Promise<void>((resolve, reject) => {
          hls.on(Hls.Events.MANIFEST_PARSED, () => resolve());
          hls.on(Hls.Events.ERROR, (_event, data) => {
            if (data.fatal) reject(new Error(`HLS error: ${data.details}`));
          });
          hls.loadSource(this.url);
          hls.attachMedia(audio);
        });
      } else if (audio.canPlayType('application/vnd.apple.mpegurl') !== '') {
        await loadNative(audio, this.url);
      } else {
        throw new Error('this browser cannot play HLS');
      }
    } else {
      await loadNative(audio, this.url);
    }

    this.node = context.createMediaElementSource(audio);
    this.node.connect(destination);

    await audio.play();
  }

  stop(): void {
    this.hls?.destroy();
    this.hls = null;
    this.node?.disconnect();
    this.node = null;
    this.audio?.pause();
    if (this.audio) this.audio.src = '';
    this.audio = null;
  }
}
