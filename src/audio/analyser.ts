/**
 * The analyser end of the audio graph, plus the liveness check.
 *
 * `fftSize` 2048 at the Kiwi's 12 kHz rate gives 1024 bins over 0–6 kHz, or ~5.9 Hz
 * per bin. An SSB signal occupies roughly the first 3 kHz, so only the first half of
 * the bins are worth rendering; the rest is band noise above the passband.
 *
 * `smoothingTimeConstant` is 0 on purpose. The analyser's temporal averaging blurs
 * exactly the short marker pulses this app exists to show.
 */

export const FFT_SIZE = 2048;

export interface Analysis {
  analyser: AnalyserNode;
  /** Number of leading bins covering the SSB passband, i.e. what to draw. */
  visibleBins: number;
}

export function createAnalyser(context: AudioContext): Analysis {
  const analyser = context.createAnalyser();
  analyser.fftSize = FFT_SIZE;
  analyser.smoothingTimeConstant = 0;
  analyser.minDecibels = -110;
  analyser.maxDecibels = -20;

  const binHz = context.sampleRate / FFT_SIZE;
  const visibleBins = Math.min(analyser.frequencyBinCount, Math.ceil(3000 / binHz));

  return { analyser, visibleBins };
}

/**
 * True if the analyser sees any energy in this instant.
 *
 * Cheap enough to poll. Used both to wait for the first audio and, afterwards, to
 * notice that audio has started arriving after a stall was reported.
 */
export function hasEnergy(analyser: AnalyserNode): boolean {
  const bins = new Uint8Array(analyser.frequencyBinCount);
  analyser.getByteFrequencyData(bins);
  return bins.some((value) => value > 0);
}

/**
 * Waits for the first audio to reach the analyser.
 *
 * Two different failures produce digital silence and neither throws or logs:
 *
 *   - a cross-origin `MediaElementAudioSourceNode`, which the Web Audio spec requires
 *     to output silence when the media element lacks `crossOrigin` or the server omits
 *     `Access-Control-Allow-Origin` (docs/RESEARCH.md §4);
 *   - a receiver that accepted the connection and sent nothing, which is what a busy
 *     KiwiSDR does.
 *
 * **The wait has to be generous.** An earlier version sampled thirty animation frames,
 * about half a second, and on a phone over mobile data that expired before the first
 * samples had crossed the network and filled the worklet's ring buffer — so the app
 * reported a stall over a signal that was arriving perfectly well, while the waterfall
 * beside it drew the marker. Polling on a timer rather than on animation frames also
 * keeps this honest in a throttled WebView, where frames are not delivered on schedule.
 */
export async function waitForSignal(
  analyser: AnalyserNode,
  timeoutMs = 8000,
  pollMs = 100,
): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    if (hasEnergy(analyser)) return true;
    await new Promise((resolve) => setTimeout(resolve, pollMs));
  }
  return hasEnergy(analyser);
}
