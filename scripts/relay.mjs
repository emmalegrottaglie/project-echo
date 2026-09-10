import { spawn } from 'node:child_process';
import { mkdirSync, rmSync } from 'node:fs';

/**
 * The relay: one receiver in, one HLS stream out, many listeners.
 *
 * Pipeline is `kiwirecorder.py --netcat | ffmpeg`, with ffmpeg writing an HLS playlist
 * and segments into `server/stream/` for the Phase 3 server to serve with CORS.
 *
 * Two design decisions worth stating.
 *
 * **No Icecast.** docs/PLAN.md §5 originally called for Icecast serving Ogg Opus with
 * an HLS ladder alongside for older Safari. Dropping Icecast removes a daemon, a
 * second port, and a second codec path, in exchange for a few seconds of extra latency
 * on a signal whose entire content is a buzz that repeats every 2.4 seconds. HLS is
 * needed for Safari regardless, so building only HLS means one output instead of two,
 * and the segments are static files our existing server already knows how to serve.
 *
 * **AAC, not Opus.** Safari cannot play Opus in MP4 at all, and Opus in HLS is not
 * dependable. AAC-LC at 32 kbps mono is more than enough for a 3 kHz SSB passband and
 * plays everywhere.
 *
 * Which receiver this points at is the operator's decision and is deliberately not
 * defaulted. Relaying one node's audio to many listeners consumes a volunteer's
 * receiver and uplink; docs/RESEARCH.md §4 says do not do that without owning the
 * hardware or holding permission, so `--authorized` has to be passed explicitly.
 *
 * Requires ffmpeg on PATH and a checkout of https://github.com/jks-prv/kiwiclient.
 *
 * Example:
 *   node scripts/relay.mjs --host my-kiwi.example.org:8073 --khz 4625 \
 *        --kiwiclient ../kiwiclient --authorized
 */

const OUTPUT_DIR = 'server/stream';
const SEGMENT_SECONDS = 2;
const SEGMENT_WINDOW = 6;
const SAMPLE_RATE = 12000;
const BITRATE = '32k';

function parseArgs(argv) {
  const args = { mode: 'usb', khz: 4625, kiwiclient: '../kiwiclient', authorized: false };

  for (let i = 0; i < argv.length; i++) {
    const flag = argv[i];
    if (flag === '--authorized') args.authorized = true;
    else if (flag === '--host') args.host = argv[++i];
    else if (flag === '--khz') args.khz = Number(argv[++i]);
    else if (flag === '--mode') args.mode = argv[++i];
    else if (flag === '--kiwiclient') args.kiwiclient = argv[++i];
    else {
      console.error(`unknown argument: ${flag}`);
      process.exit(2);
    }
  }
  return args;
}

const args = parseArgs(process.argv.slice(2));

if (!args.host) {
  console.error('--host <host:port> is required');
  process.exit(2);
}

if (!args.authorized) {
  console.error(
    [
      'Refusing to start without --authorized.',
      '',
      'This relays one receiver to every listener of the app, which spends that',
      "receiver's channels and uplink. Pass --authorized only if the receiver is",
      'yours, or its operator has agreed in writing. See docs/RESEARCH.md section 4.',
    ].join('\n'),
  );
  process.exit(2);
}

const [hostname] = args.host.split(':');
console.log(`relaying ${hostname} @ ${args.khz} kHz ${args.mode.toUpperCase()} to ${OUTPUT_DIR}/live.m3u8`);

// Stale segments from a previous run would be advertised by the new playlist before
// ffmpeg overwrites them, so the directory starts empty.
rmSync(OUTPUT_DIR, { recursive: true, force: true });
mkdirSync(OUTPUT_DIR, { recursive: true });

const [host, port = '8073'] = args.host.split(':');

const recorder = spawn(
  'python',
  [
    `${args.kiwiclient}/kiwirecorder.py`,
    '--server-host', host,
    '--server-port', port,
    '--freq', String(args.khz),
    '--modulation', args.mode,
    '--user', 'ProjectEcho',
    // Uncompressed samples: the alternative is IMA ADPCM, and there is no reason to
    // decode it only to re-encode as AAC.
    '--no-compression',
    // Raw PCM on stdout, which is what the ffmpeg input below expects.
    '--netcat',
  ],
  { stdio: ['ignore', 'pipe', 'inherit'] },
);

const ffmpeg = spawn(
  'ffmpeg',
  [
    '-hide_banner',
    '-loglevel', 'warning',
    '-f', 's16le',
    '-ar', String(SAMPLE_RATE),
    '-ac', '1',
    '-i', 'pipe:0',
    '-c:a', 'aac',
    '-b:a', BITRATE,
    '-f', 'hls',
    '-hls_time', String(SEGMENT_SECONDS),
    '-hls_list_size', String(SEGMENT_WINDOW),
    '-hls_flags', 'delete_segments+append_list+omit_endlist',
    '-hls_segment_filename', `${OUTPUT_DIR}/live%03d.aac`,
    `${OUTPUT_DIR}/live.m3u8`,
  ],
  { stdio: ['pipe', 'inherit', 'inherit'] },
);

recorder.stdout.pipe(ffmpeg.stdin);

/** Either process dying makes the stream stale, so both go down together. */
function shutdown(reason, code = 0) {
  console.log(`relay stopping: ${reason}`);
  recorder.kill();
  ffmpeg.kill();
  process.exit(code);
}

recorder.on('exit', (code) => shutdown(`kiwirecorder exited (${code})`, code ?? 0));
ffmpeg.on('exit', (code) => shutdown(`ffmpeg exited (${code})`, code ?? 0));
recorder.on('error', (error) => shutdown(`kiwirecorder failed to start: ${error.message}`, 1));
ffmpeg.on('error', (error) => shutdown(`ffmpeg failed to start: ${error.message}`, 1));
process.on('SIGINT', () => shutdown('interrupted'));
