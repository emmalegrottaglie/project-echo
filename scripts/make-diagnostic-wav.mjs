import { mkdirSync, writeFileSync } from 'node:fs';

/**
 * Writes the diagnostic marker recording.
 *
 * A fixed 30-second file shaped like The Buzzer — a 1.2 s tone repeating every 2.4 s
 * over low noise — served by the Phase 3 server both with and without CORS headers. It
 * gives the client two things that are otherwise hard to get:
 *
 *   - a media-element audio path to exercise, without connecting to anyone's receiver;
 *   - a reproducible cross-origin silence failure, which is the one audio bug that
 *     throws nothing, logs nothing, and looks exactly like a dead antenna.
 *
 * 12 kHz mono to match a KiwiSDR's own rate.
 *
 * Run: node scripts/make-diagnostic-wav.mjs
 */

const SAMPLE_RATE = 12000;
const SECONDS = 30;
const TONE_HZ = 800;
const PERIOD_SEC = 2.4;
const TONE_SEC = 1.2;
const OUTPUT = 'server/diagnostic/marker.wav';

const frames = SAMPLE_RATE * SECONDS;
const samples = Buffer.alloc(frames * 2);

for (let i = 0; i < frames; i++) {
  const t = i / SAMPLE_RATE;
  const gated = t % PERIOD_SEC < TONE_SEC;
  const tone = gated ? Math.sin(2 * Math.PI * TONE_HZ * t) * 0.3 : 0;
  const noise = (Math.random() * 2 - 1) * 0.02;
  samples.writeInt16LE(Math.max(-1, Math.min(1, tone + noise)) * 32767, i * 2);
}

/** Canonical 44-byte PCM WAV header. */
function header(dataLength) {
  const buffer = Buffer.alloc(44);
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataLength, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // fmt chunk size
  buffer.writeUInt16LE(1, 20); // PCM
  buffer.writeUInt16LE(1, 22); // mono
  buffer.writeUInt32LE(SAMPLE_RATE, 24);
  buffer.writeUInt32LE(SAMPLE_RATE * 2, 28); // byte rate
  buffer.writeUInt16LE(2, 32); // block align
  buffer.writeUInt16LE(16, 34); // bits per sample
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataLength, 40);
  return buffer;
}

mkdirSync('server/diagnostic', { recursive: true });
writeFileSync(OUTPUT, Buffer.concat([header(samples.length), samples]));

console.log(
  `wrote ${OUTPUT} — ${SECONDS}s, ${SAMPLE_RATE} Hz mono, ` +
    `${TONE_SEC}s tone every ${PERIOD_SEC}s (${(60 / PERIOD_SEC).toFixed(0)}/min)`,
);
