import { spawnSync } from 'node:child_process';
import { copyFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';

/**
 * Builds the debug APK and drops it in the repository root.
 *
 * A script rather than a line in `package.json` because the Gradle wrapper is
 * `gradlew.bat` on Windows and `./gradlew` elsewhere, and neither is on `PATH` — npm's
 * shell would not resolve it either way.
 *
 * Run `npm run android:apk`, which syncs the web assets first.
 */

const ANDROID_DIR = 'android';
const OUTPUT = 'project-echo-debug.apk';
const BUILT = join(ANDROID_DIR, 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk');

if (!existsSync(ANDROID_DIR)) {
  console.error(`no ${ANDROID_DIR}/ directory — run \`npx cap add android\` first`);
  process.exit(1);
}

// An absolute path, quoted: cmd does not resolve a bare `gradlew.bat` from the cwd
// handed to the child, and a Windows `.bat` can only be spawned through a shell, which
// does no quoting of its own.
const windows = process.platform === 'win32';
const wrapper = resolve(ANDROID_DIR, windows ? 'gradlew.bat' : 'gradlew');

const gradle = spawnSync(windows ? `"${wrapper}"` : wrapper, ['assembleDebug', '--console=plain'], {
  cwd: ANDROID_DIR,
  stdio: 'inherit',
  shell: windows,
});

if (gradle.status !== 0) {
  console.error('gradle build failed');
  process.exit(gradle.status ?? 1);
}

copyFileSync(BUILT, OUTPUT);
console.log(`\nwrote ${OUTPUT} — install with:`);
console.log('  adb install -r project-echo-debug.apk');
console.log('\nDebug signing key. Fine for testing, not for distribution.');
