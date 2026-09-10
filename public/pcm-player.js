/**
 * Ring-buffer playback worklet.
 *
 * The Kiwi WebSocket delivers PCM in bursts on the main thread; the audio graph needs
 * it in 128-frame blocks on the audio thread. This node buffers the bursts and hands
 * out blocks, resampling linearly when the context rate does not match the source.
 *
 * Plain JavaScript in /public rather than TypeScript because an AudioWorklet is loaded
 * by URL at runtime, not imported.
 */

const RING_SECONDS = 4;

class PcmPlayer extends AudioWorkletProcessor {
  constructor(options) {
    super();
    const { sourceRate } = options.processorOptions;
    // eslint-disable-next-line no-undef
    this.ratio = sourceRate / sampleRate;
    this.ring = new Float32Array(Math.ceil(sourceRate * RING_SECONDS));
    this.writeIndex = 0;
    this.readPosition = 0;
    this.available = 0;
    this.underruns = 0;

    this.port.onmessage = (event) => {
      const samples = event.data;
      for (let i = 0; i < samples.length; i++) {
        this.ring[this.writeIndex] = samples[i];
        this.writeIndex = (this.writeIndex + 1) % this.ring.length;
      }
      this.available = Math.min(this.available + samples.length, this.ring.length);
    };
  }

  /** Linear interpolation between the two ring samples straddling `position`. */
  sampleAt(position) {
    const base = Math.floor(position);
    const frac = position - base;
    const a = this.ring[base % this.ring.length];
    const b = this.ring[(base + 1) % this.ring.length];
    return a + (b - a) * frac;
  }

  process(_inputs, outputs) {
    const channel = outputs[0][0];
    const needed = channel.length * this.ratio;

    // Hold silence until enough audio has arrived to cover this block plus a margin,
    // otherwise the ring is read past the write head and the marker pulses tear.
    if (this.available < needed + 2) {
      channel.fill(0);
      this.underruns++;
      if (this.underruns % 100 === 1) this.port.postMessage({ underrun: true });
      return true;
    }

    for (let i = 0; i < channel.length; i++) {
      channel[i] = this.sampleAt(this.readPosition);
      this.readPosition += this.ratio;
    }
    this.readPosition %= this.ring.length;
    this.available -= needed;
    return true;
  }
}

registerProcessor('pcm-player', PcmPlayer);
