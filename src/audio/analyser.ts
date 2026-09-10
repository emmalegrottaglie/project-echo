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
 * Confirms the analyser is receiving audio rather than digital silence.
 *
 * Two different failures look identical in the UI — a dead waterfall — and neither
 * throws or logs:
 *
 *   - a cross-origin `MediaElementAudioSourceNode`, which the Web Audio spec requires
 *     to output silence when the media element lacks `crossOrigin` or the server omits
 *     `Access-Control-Allow-Origin` (docs/RESEARCH.md §4);
 *   - a connected but stalled stream, which is the usual outcome of a busy Kiwi.
 *
 * There is no feature test for the first and `createMediaElementSource` cannot be
 * reverted, so the only reliable check is to look at the samples. Resolves true if any
 * frame carries energy within the window.
 */
export async function hasSignal(analyser: AnalyserNode, frames = 30): Promise<boolean> {
  const bins = new Uint8Array(analyser.frequencyBinCount);

  for (let i = 0; i < frames; i++) {
    await new Promise((resolve) => requestAnimationFrame(resolve));
    analyser.getByteFrequencyData(bins);
    if (bins.some((value) => value > 0)) return true;
  }
  return false;
}
