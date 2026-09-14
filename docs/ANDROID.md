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

Capacitor serves the page from the phone itself, so a relative `/api/...` asks the phone
and there is nothing there to answer. Out of the box the three server-dependent features
detect that and hide, exactly as they do in `npm run dev`:

| Works with no server | Hidden until a server is set |
|---|---|
| Live waterfall against a real KiwiSDR | In-app receiver directory |
| Marker detection | "Heard here" hearings |
| Schedule, countdowns and alerts | Relay and the CORS diagnostics |
| The 141-station archive | Roster updates without a new APK |
| All four themes, the phone layout | |

**Point it at a server and the right-hand column comes back**, but the server has to be
told to answer. Two settings, both needed:

```bash
HOST=0.0.0.0 ECHO_ALLOW_ORIGIN=http://localhost npm start
```

`HOST` binds it to the network so the phone can reach it at all. `ECHO_ALLOW_ORIGIN` is
the app's own origin: Capacitor serves the page from the phone at `http://localhost`, so
every call to a server on the network is cross-origin, and the API answers no origin by
default. Without it the app fails at the first request with nothing to read — the
directory stays hidden and the roster silently never updates.

A named origin rather than `*`, because `*` is what once let any page the user visited
read every hearing this server holds. See the security note below before running either
on anything but a home network.

Then on the phone: **Receiver → Use a server**, and give the address, e.g.
`http://192.168.1.10:8080`. Empty means "whichever origin served the page", which is
what a desktop wants and what the phone cannot use.

So the first thing to do on the phone is add a receiver by hand — **Receiver → Paste a
host**. One that worked during on-air testing:

```
sdr.autreradioautreculture.com:8074     grid JN04KU
```

Saved receivers live in `localStorage`, which is per-origin, so the ones saved in a
desktop browser do not come across.

## Testing everything, including the server

Two ways, and they are no longer the same trade they were.

```bash
HOST=0.0.0.0 npm start
```

> **Security.** This binds the server to every interface, and
> `POST /api/observations` takes writes without authentication. Anything on the network
> can write to it. Acceptable on a home network for a test; do not do it on a shared or
> public one, and stop the server afterwards.

**In the APK**, set the address under **Receiver → Use a server** and the
server-dependent features come back — the directory, hearings, the relay, and roster
updates that arrive without a new APK. This is now the better way to test, because it is
the app people would actually install.

**In the phone's browser**, browse to `http://<your-machine-ip>:8080` on the same Wi-Fi.
Everything works with no configuration, which makes it the quicker check. What it cannot
test is the two things only the packaged app has: alerts that fire while it is closed,
and how the shell behaves without browser chrome.

Either way, find the address with `ipconfig` — on this machine it was `192.168.31.131`,
but it changes.

## Alerts

The packaged app schedules alerts with Android itself, so a reminder arrives with the
app closed — which is the only form of it worth having, given a transmission window
comes round a few times a week. A browser cannot do this, and the same app in a phone
browser still cannot: its alerts need an open tab.

Two Android switches decide whether this works, and both live outside the app:

- **Notifications** must be allowed. The app asks the first time a switch is flipped in
  the Schedule tab. Declining is recoverable in system settings, and the schedule says
  so rather than reporting the app as incapable.
- **Alarms & reminders**, under the app's settings, decides whether the reminder lands
  on the minute. Without it the plugin falls back to an inexact alarm, which Android may
  delay while the phone is dozing — so a late alert rather than none.

The soonest 48 are scheduled, two occurrences per subscribed slot, and topped up
whenever the schedule is opened or a switch is flipped. Android holds a bounded number
of pending alarms and drops the excess without saying which, and this roster has 186
slots.

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
- **The notification handover is unverified on a device.** Everything that decides
  *which* alerts get scheduled is tested in `test/notify.test.ts`, but whether Android
  actually delivers one can only be found out by waiting for a window on a real phone.
- **The `ws://` connection and the propagation image are only testable on a device.**
  Both are permitted by the Content Security Policy on paper; an Android WebView is not
  a desktop browser, and both fail quietly rather than with an error.
- **iOS.** `npx cap add ios` needs macOS.
