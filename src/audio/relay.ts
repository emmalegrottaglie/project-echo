import type { AudioSource } from './source';

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
 */
export class RelaySource implements AudioSource {
  private audio: HTMLAudioElement | null = null;
  private node: MediaElementAudioSourceNode | null = null;
  private hls: { destroy(): void } | null = null;

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

    const nativeHls = audio.canPlayType('application/vnd.apple.mpegurl') !== '';

    if (this.url.endsWith('.m3u8') && !nativeHls) {
      // Loaded on demand so a session that never plays the relay never pays for it.
      const { default: Hls } = await import('hls.js');
      if (!Hls.isSupported()) throw new Error('this browser cannot play HLS');

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
    } else {
      audio.src = this.url;
      await new Promise<void>((resolve, reject) => {
        audio.addEventListener('loadedmetadata', () => resolve(), { once: true });
        audio.addEventListener(
          'error',
          () => reject(new Error(`could not load ${this.url}`)),
          { once: true },
        );
      });
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
