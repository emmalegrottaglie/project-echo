import { openSheet, type Sheet } from './ui';

/**
 * What the app is and how to use it, in plain words.
 *
 * docs/MOBILE_UI_SPEC.md §11 ruled out onboarding, and that was written before anyone
 * had used the app on a phone. The first real session produced "I'm not quite sure I
 * know what it all means" and "I'm not sure why the Synthetic button exists", which is
 * the spec being wrong rather than the user. What it ruled out was a carousel and a
 * tour, and this is neither: one screen, dismissible, reachable afterwards from the `?`
 * in the header.
 *
 * It opens by itself only once, when there is no receiver saved and it has not been
 * dismissed before.
 */

const SEEN_KEY = 'echo.helpSeen';

export function helpHasBeenSeen(): boolean {
  try {
    return localStorage.getItem(SEEN_KEY) === '1';
  } catch {
    return true;
  }
}

function markSeen(): void {
  try {
    localStorage.setItem(SEEN_KEY, '1');
  } catch {
    // Storage unavailable; it will offer itself again next launch. Not worth failing on.
  }
}

const CONTENT = `
  <p class="echo-help__lede">
    Somewhere in Russia a transmitter has been sending a buzz on the same frequency for
    decades, without ever saying why. Two more send a beep and a squeak. This app lets
    you listen to them, and tells you whether the one you picked is actually on the air
    right now.
  </p>

  <h4>Getting a signal</h4>
  <ol class="echo-help__steps">
    <li>
      <strong>Add a receiver.</strong> You do not need an aerial. Volunteers around the
      world leave radio receivers connected to the internet, and the app borrows one.
      Tap <em>Receiver</em>, then paste a host — or browse the public list if you are
      running the app's server.
    </li>
    <li>
      <strong>Pick a station.</strong> Tap <em>Station</em>. Some have a separate
      daytime and night-time frequency, and the wrong one will just sound like noise,
      so the list says which is which.
    </li>
    <li>
      <strong>Tap Connect</strong> and wait. Audio takes a few seconds to arrive, and
      the detector needs about twenty-five more before it will commit to an answer.
    </li>
  </ol>

  <h4>Reading the screen</h4>
  <p>
    The big coloured panel is a <strong>spectrogram</strong>. Time runs downwards, so
    the newest moment is the bottom edge, and pitch runs left to right. A marker looks
    like a row of evenly spaced bright dashes. Static looks like an even orange fog.
  </p>
  <p>
    Under it, one line says what the app makes of the sound:
  </p>
  <dl class="echo-help__states">
    <dt>listening…</dt>
    <dd>Working it out. Give it half a minute.</dd>
    <dt>pulses present, measuring period…</dt>
    <dd>Something is pulsing but it has not timed enough of them yet.</dd>
    <dt>pulses present but irregular</dt>
    <dd>
      It can hear pulses without a steady rhythm. Usually the signal is too weak, or a
      voice message has interrupted the marker.
    </dd>
    <dt>marker detected</dt>
    <dd>
      A steady rhythm, with the measured gap between pulses. If that disagrees with the
      published figure the app says so rather than picking a winner — the published
      figures are often wrong.
    </dd>
    <dt>no marker</dt>
    <dd>
      Static, or the transmitter is off. Shortwave depends on the ionosphere, so a
      station can be entirely inaudible from where you are and perfectly loud elsewhere.
      <em>Propagation</em> on the Live tab shows whether the band is open at all.
    </dd>
  </dl>

  <h4>The Demo button</h4>
  <p>
    It plays a fake marker generated on your phone — no receiver, no internet. It is
    there to show you what a detected signal looks and sounds like, and to check the app
    itself is working when a real receiver gives you nothing. Nothing it shows came off
    the air.
  </p>

  <h4>If it says no audio arrived</h4>
  <p>
    That usually means the receiver was already full. Each one takes only four listeners
    at a time. Tap <em>Try another</em> and pick a different one. If the waterfall starts
    moving anyway, the message clears itself.
  </p>

  <h4>The other two tabs</h4>
  <p>
    <strong>Schedule</strong> lists the stations that still send actual messages, and
    when they are next due, so you can be there. <strong>Archive</strong> holds all 141
    known stations — nearly all of them long dead — with dates and sources for every
    claim.
  </p>

  <h4>One thing this app will not do</h4>
  <p>
    It records that a signal was heard, when, and at what rhythm. It never records or
    interprets what a transmission said. Listening is legal almost everywhere;
    publishing the contents of these transmissions is not, and that line is deliberate.
  </p>
`;

/** Opens the help sheet. Marks it seen, so it stops offering itself. */
export function openHelp(): Sheet {
  markSeen();

  const sheet = openSheet('What is this?', '', undefined);
  sheet.body.innerHTML = `<div class="echo-help">${CONTENT}</div>`;
  return sheet;
}
