# Android build

An installable wrapper for testing on a real phone. The app inside is the same web
build; nothing is Android-specific except the two settings below, and both exist for the
same reason the app cannot be hosted over https.

## Install the test build

```bash
npm run android:apk
```

The APK lands at `project-echo-debug.apk` in the repository root, about 4.7 MB. Get it
onto the phone either way:

```bash
# over USB, with developer mode and USB debugging on
"$ANDROID_HOME/platform-tools/adb" install -r project-echo-debug.apk
```

or copy the file across and tap it, allowing "install unknown apps" for whatever moved
it. It is a **debug** APK signed with the local debug key — fine for testing, not for
distribution.

## Why the two settings matter

Both live in [`capacitor.config.json`](../capacitor.config.json) and the
[manifest](../android/app/src/main/AndroidManifest.xml), and the app does not work
without them.

**`server.androidScheme: "http"`.** Capacitor serves the bundle from `https://localhost`
by default. From an https origin a `ws://` connection to a public KiwiSDR is mixed
content and the WebView blocks it — the same wall that stops this app being hosted, and
[README](../README.md#deployment-constraint) explains why the receivers are `ws://` in
the first place. Serving from `http://localhost` instead removes that, and localhost is
still treated as a secure context, so Web Audio and the AudioWorklet keep working.

**`android:usesCleartextTraffic="true"`.** Android blocks cleartext from API 28 up.
Public nodes are plain http on odd ports, so without this the socket never opens.

`WAKE_LOCK` is also declared: watching a marker is a long stare at a scrolling canvas,
and the default screen timeout ends the session. Nothing requests the lock yet.

## What works on the phone, and what does not

The APK carries no server, and [`src/api.ts`](../src/api.ts) calls it on relative paths,
so `/api/health` resolves inside the app to nothing. The three server-dependent features
detect that and hide, exactly as they do in `npm run dev`:

| Works | Hidden |
|---|---|
| Live waterfall against a real KiwiSDR | In-app receiver directory |
| Marker detection | "Heard here" hearings |
| Schedule, countdowns, alerts | Relay and the CORS diagnostics |
| The 141-station archive | |
| All four themes, the phone layout | |

So the first thing to do on the phone is add a receiver by hand — **Receiver → Paste a
host**. One that worked during on-air testing:

```
sdr.autreradioautreculture.com:8074     grid JN04KU
```

Saved receivers live in `localStorage`, which is per-origin, so the ones saved in a
desktop browser do not come across.

## Testing everything, including the server

For full coverage, skip the APK and open the app from your machine in the phone's
browser. Then the server is present and every feature works.

> **Security.** This binds the server to every interface, and
> `POST /api/observations` has no authentication. Anything on the network can write to
> it. Acceptable on a home network for a test; do not do it on a shared or public one,
> and stop the server afterwards.

```bash
HOST=0.0.0.0 npm start
```

Then browse to `http://<your-machine-ip>:8080` on the phone, on the same Wi-Fi. On this
machine that was `192.168.31.131`, but check it — it changes.

This is the better way to test the app. The APK is the better way to test whether it
*feels* like an app: no browser chrome, its own icon, the safe-area insets doing their
job.

## Rebuilding after a change

```bash
npm run build && npx cap sync android    # web assets into the native project
npm run android:apk                      # or the two above plus gradle in one step
```

The generated `android/` project is committed so the manifest edits above survive, but
its build outputs, the copied web assets and the APK are all gitignored — they are
artefacts, and `npx cap sync` regenerates the copies from `dist/`.

## Not done

- **Release signing.** Debug only. A distributable build needs a keystore and
  `assembleRelease`, and there is nothing to distribute to yet.
- **Nothing has been run on a phone.** This build has never been installed; it compiles
  and contains the right assets and permissions, and that is all that has been verified
  from here.
- **iOS.** `npx cap add ios` needs macOS.
