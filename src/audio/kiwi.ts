import { KIWI_SAMPLE_RATE, type AudioSource } from './source';

/**
 * KiwiSDR WebSocket audio client.
 *
 * Protocol follows jks-prv/kiwiclient (kiwi/client.py):
 *
 *   - connect to `ws://<host>/<unix-seconds>/SND`
 *   - every frame is binary; the first three bytes are an ASCII tag
 *     ('MSG' for text parameters, 'SND' for audio, 'W/F' for waterfall)
 *   - MSG bodies are space-separated `key=value` pairs, offset by one byte
 *   - SND bodies are: flags (u8), sequence (u32 LE), S-meter (u16 BE), then samples
 *   - `SET compression=0` gives raw signed 16-bit samples instead of IMA ADPCM,
 *     which is the whole reason this client does not need an ADPCM decoder
 *   - sample endianness is little when flags & 0x80, big otherwise
 *
 * A WebSocket is not subject to the cross-origin silence rule that afflicts
 * `MediaElementAudioSourceNode` (docs/RESEARCH.md §4), so this path has no CORS
 * problem. It has a mixed-content problem instead: a page served over https cannot
 * open a ws:// socket, and public nodes are overwhelmingly plain http. See README.md.
 */

const SND_FLAG_LITTLE_ENDIAN = 0x80;
const KEEPALIVE_MS = 5000;

export interface KiwiOptions {
  /** 'host:port', no scheme. */
  host: string;
  /** Dial frequency in kHz. */
  khz: number;
  mode: 'usb' | 'lsb' | 'am' | 'cw';
  onStatus(message: string): void;
}

export class KiwiSource implements AudioSource {
  readonly label: string;
  readonly silenceHint =
    'The receiver accepted the connection but never sent any audio. A KiwiSDR has only ' +
    'four channels and yours may all be in use — try another receiver.';

  private socket: WebSocket | null = null;
  private node: AudioWorkletNode | null = null;
  private keepalive: number | null = null;
  private ready = false;

  constructor(private readonly options: KiwiOptions) {
    this.label = `${options.host} @ ${options.khz} kHz ${options.mode.toUpperCase()}`;
  }

  async start(context: AudioContext, destination: AudioNode): Promise<void> {
    await context.audioWorklet.addModule('/pcm-player.js');

    this.node = new AudioWorkletNode(context, 'pcm-player', {
      numberOfInputs: 0,
      numberOfOutputs: 1,
      outputChannelCount: [1],
      processorOptions: { sourceRate: KIWI_SAMPLE_RATE },
    });
    this.node.connect(destination);

    // The path carries a cache-busting timestamp and the stream name, which mean
    // nothing to a reader and made the line wider than a phone. The host is the part
    // somebody can act on.
    const url = `ws://${this.options.host}/${Math.floor(Date.now() / 1000)}/SND`;
    this.options.onStatus(`connecting to ${this.options.host}`);

    await new Promise<void>((resolve, reject) => {
      const socket = new WebSocket(url);
      socket.binaryType = 'arraybuffer';
      this.socket = socket;

      // A rejected or silently dropped connection is the common case with public
      // nodes — all channels busy, or the node is down — so fail loudly rather than
      // hanging on a socket that will never open.
      const timeout = window.setTimeout(() => {
        socket.close();
        reject(new Error(`no response from ${this.options.host} after 10 s`));
      }, 10_000);

      socket.onopen = () => {
        this.send('SET auth t=kiwi p=');
        this.send('SET ident_user=ProjectEcho');
      };

      socket.onmessage = (event) => {
        const frame = new Uint8Array(event.data as ArrayBuffer);
        const tag = String.fromCharCode(frame[0]!, frame[1]!, frame[2]!);

        if (tag === 'MSG') {
          const text = new TextDecoder().decode(frame.subarray(4));
          this.handleParameters(text);
          if (this.ready) {
            window.clearTimeout(timeout);
            resolve();
          }
        } else if (tag === 'SND') {
          this.handleAudio(frame.subarray(3));
        }
      };

      socket.onerror = () => {
        window.clearTimeout(timeout);
        reject(new Error(`could not reach ${this.options.host} over ws://`));
      };

      socket.onclose = (close) => {
        window.clearTimeout(timeout);
        this.options.onStatus(`connection closed (${close.code})`);
        reject(new Error(`connection to ${this.options.host} closed (${close.code})`));
      };
    });

    this.keepalive = window.setInterval(() => this.send('SET keepalive'), KEEPALIVE_MS);
  }

  stop(): void {
    if (this.keepalive !== null) window.clearInterval(this.keepalive);
    this.keepalive = null;
    this.socket?.close();
    this.socket = null;
    this.node?.disconnect();
    this.node = null;
    this.ready = false;
  }

  private send(message: string): void {
    if (this.socket?.readyState === WebSocket.OPEN) this.socket.send(message);
  }

  /**
   * The server announces its sample rate once the connection is authorised; that
   * message is the cue to configure the receiver. Ordering matters — the Kiwi ignores
   * mode and frequency until it has been told the audio rate has been accepted.
   */
  private handleParameters(text: string): void {
    for (const pair of text.split(' ')) {
      const [key, value] = pair.split('=');
      if (key === 'sample_rate' && value) {
        this.send(`SET AR OK in=${Math.round(Number(value))} out=44100`);
        this.send('SET gen=0 mix=-1');
        this.send(
          `SET mod=${this.options.mode} low_cut=300 high_cut=2700 freq=${this.options.khz.toFixed(3)}`,
        );
        this.send('SET agc=1 hang=0 thresh=-100 slope=6 decay=1000 manGain=50');
        this.send('SET compression=0');
        this.ready = true;
        this.options.onStatus(`tuned ${this.options.khz} kHz ${this.options.mode.toUpperCase()}`);
      } else if (key === 'too_busy') {
        this.options.onStatus('receiver reports all channels busy');
      }
    }
  }

  private handleAudio(body: Uint8Array): void {
    if (body.length < 8 || !this.node) return;

    const flags = body[0]!;
    const littleEndian = (flags & SND_FLAG_LITTLE_ENDIAN) !== 0;
    const payload = body.subarray(7);
    const count = payload.length >> 1;
    const view = new DataView(payload.buffer, payload.byteOffset, count * 2);

    const samples = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      samples[i] = view.getInt16(i * 2, littleEndian) / 32768;
    }
    this.node.port.postMessage(samples, [samples.buffer]);
  }
}
