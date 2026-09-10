import type { AudioSource } from './source';

/**
 * A synthetic channel marker.
 *
 * This exists so the waterfall and the whole live view can be exercised without
 * connecting to a volunteer's receiver — which matters both for development and
 * because a public node has four hardware channels and no interest in carrying our
 * test traffic. It reproduces the Buzzer's shape: a ~1.2 s tone repeating at the
 * configured period, over shaped noise standing in for band hiss.
 */
export class SyntheticSource implements AudioSource {
  readonly label = 'demo signal';
  readonly silenceHint =
    'The demo signal produced no sound, which should not happen. The browser may be ' +
    'holding audio until the page is tapped.';

  private nodes: AudioNode[] = [];
  private oscillator: OscillatorNode | null = null;

  constructor(
    private readonly toneHz = 800,
    private readonly periodSec = 2.4,
    private readonly toneSec = 1.2,
  ) {}

  async start(context: AudioContext, destination: AudioNode): Promise<void> {
    const noise = context.createBufferSource();
    const buffer = context.createBuffer(1, context.sampleRate * 2, context.sampleRate);
    const channel = buffer.getChannelData(0);
    for (let i = 0; i < channel.length; i++) channel[i] = (Math.random() * 2 - 1) * 0.04;
    noise.buffer = buffer;
    noise.loop = true;

    const oscillator = context.createOscillator();
    oscillator.frequency.value = this.toneHz;
    const gate = context.createGain();
    gate.gain.value = 0;

    // Schedule the gate as a step function rather than switching it from a timer, so
    // the pulse edges land on exact sample boundaries and the marker period the
    // detector measures is the period actually transmitted.
    const start = context.currentTime + 0.1;
    const pulses = Math.ceil(600 / this.periodSec);
    for (let i = 0; i < pulses; i++) {
      const at = start + i * this.periodSec;
      gate.gain.setValueAtTime(0.25, at);
      gate.gain.setValueAtTime(0, at + this.toneSec);
    }

    oscillator.connect(gate).connect(destination);
    noise.connect(destination);
    oscillator.start(start);
    noise.start(start);

    this.oscillator = oscillator;
    this.nodes = [noise, gate];
  }

  stop(): void {
    this.oscillator?.stop();
    this.oscillator?.disconnect();
    this.oscillator = null;
    for (const node of this.nodes) node.disconnect();
    this.nodes = [];
  }
}
