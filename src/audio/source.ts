/**
 * An audio source feeding the analyser.
 *
 * Two implementations exist because both are needed now, not to leave a hook open:
 * `KiwiSource` is the real receiver, and `SyntheticSource` generates a Buzzer-like
 * marker so the waterfall and the marker detector can be exercised without occupying
 * a volunteer's receiver. A Phase 3 relay of our own hardware would be a third.
 */
export interface AudioSource {
  readonly label: string;
  /**
   * What to tell the user if no audio ever arrives. Silence means something different
   * for each transport — a busy receiver, a missing CORS header, a blocked audio
   * context — and only the transport knows which.
   */
  readonly silenceHint: string;
  /** Connects and begins producing audio into `destination`. Resolves once running. */
  start(context: AudioContext, destination: AudioNode): Promise<void>;
  stop(): void;
}

/** Kiwi audio is 12 kHz; matching the context rate avoids resampling entirely. */
export const KIWI_SAMPLE_RATE = 12000;

/**
 * Creates the AudioContext at the receiver's own sample rate where the browser allows
 * it, so the FFT bins line up with the SSB passband and no resampling is needed. Falls
 * back to the default rate, in which case the worklet resamples.
 */
export function createContext(): AudioContext {
  try {
    return new AudioContext({ sampleRate: KIWI_SAMPLE_RATE });
  } catch {
    return new AudioContext();
  }
}
