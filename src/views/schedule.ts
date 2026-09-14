import {
  isSubscribed,
  LEAD_MS,
  permission,
  requestPermission,
  slotKey,
  toggleSubscription,
} from '../alerts';
import { allStations } from '../data/stations';
import {
  countdown,
  describeScheduleKhz,
  formatLocal,
  formatUtc,
  upcoming,
} from '../schedule';
import { alertSwitch, button, esc, gapNotice } from '../ui';

/**
 * Schedule tab: upcoming transmission windows, soonest first, each with an alert.
 *
 * The coverage note states two facts every time — how much of the data is actually
 * imported, and what the notification permission can and cannot do. Ten of the
 * twenty-six active stations publish a schedule Priyom tabulates; the rest publish
 * none, so a station absent from this list has to read as a gap in the source rather
 * than as a quiet band.
 *
 * Frequencies rotate month by month and each slot stores twelve, so the one shown is
 * the one for the month that window falls in — which for a window three weeks out is
 * not necessarily this month's.
 */

const TICK_MS = 30_000;
const URGENT_MS = 60 * 60 * 1000;

const PERMISSION_COPY: Record<string, string> = {
  default: 'Enable notifications to be reminded before a window opens.',
  granted:
    `Alerts fire ${LEAD_MS / 60_000} minutes ahead, while a tab is open. There is no ` +
    'service worker, so a closed browser means no alert.',
  denied:
    'Notifications are blocked for this site. Alerts will not fire until that is ' +
    'changed in browser settings.',
  unsupported:
    'This browser has no Notification API, so alerts cannot fire here and the ' +
    'switches are disabled. The Android app is in this state: its WebView has no ' +
    'notifications. Opening the app in a phone browser does have them.',
};

export function scheduleView(): { element: HTMLElement; destroy: () => void } {
  const element = document.createElement('section');
  element.className = 'view view-schedule';

  const scheduled = allStations().filter((station) => station.tier === 'scheduled');
  const withSchedules = scheduled.filter((station) => station.schedules.length > 0);

  element.innerHTML = `
    <div class="echo-scroll">
      <div class="echo-coverage">
        <p>
          ${withSchedules.length} of ${scheduled.length} active stations publish a schedule.
          The rest are transmitting but list no times, so they cannot be counted down to.
          Times are as published, in UTC, and are the reliable part. <strong>Frequencies
          are not a timetable</strong> — they are what listeners last reported, they move
          faster than the record follows, and a slot can be on the air on a frequency
          nobody has written down yet. Treat one as where to start tuning.
        </p>
        <p class="echo-coverage__permission"></p>
        <div class="echo-permission-action"></div>
      </div>
      <div class="echo-rows"></div>
    </div>
  `;

  const permissionLine = element.querySelector<HTMLElement>('.echo-coverage__permission')!;
  const permissionAction = element.querySelector<HTMLElement>('.echo-permission-action')!;
  const rows = element.querySelector<HTMLElement>('.echo-rows')!;

  /**
   * Whether arming an alert could ever produce one.
   *
   * Android's WebView ships no Notification API, so in the packaged app this is false
   * and no alert will fire however many switches are on. A switch that flips and then
   * does nothing is the same lie as a button that cannot work — the reason the
   * permission control below only renders when asking would achieve something.
   */
  const alertsCanFire = (): boolean => permission() === 'granted';

  const renderPermission = (): void => {
    const state = permission();
    permissionLine.textContent = PERMISSION_COPY[state] ?? PERMISSION_COPY['default']!;
    permissionLine.classList.toggle('echo-coverage__permission--denied', state === 'denied');

    // The button renders only in the not-asked state: denied is not recoverable
    // in-app, so offering a control that cannot work would be a lie.
    permissionAction.innerHTML =
      state === 'default'
        ? button({ label: 'Enable notifications', variant: 'primary', name: 'permission' })
        : '';
  };

  const render = (): void => {
    const now = new Date();
    const windows = upcoming(allStations(), now);

    if (!windows.length) {
      rows.innerHTML = `<div class="echo-detail__body">${gapNotice(
        'No windows',
        'No schedules have been imported yet. This is a data gap, not a quiet band.',
      )}</div>`;
      return;
    }

    rows.innerHTML = windows
      .map(({ station, schedule, at }) => {
        const key = slotKey(station, schedule);
        const urgent = at.getTime() - now.getTime() < URGENT_MS;

        return (
          `<div class="echo-schedule-row">` +
          alertSwitch(isSubscribed(key), key, !alertsCanFire()) +
          `<div class="echo-schedule-row__main">` +
          `<div class="echo-schedule-row__title">` +
          `<span class="echo-schedule-row__designator">${esc(station.enigmaId)}</span>` +
          `<span class="echo-schedule-row__name">${esc(station.name)}</span>` +
          `</div>` +
          `<div class="echo-schedule-row__times">${esc(formatUtc(at))} · ${esc(
            formatLocal(at),
          )}</div>` +
          `<div class="echo-schedule-row__freq">${esc(describeScheduleKhz(schedule, at))}` +
          `<span class="echo-dim"> · read ${esc(schedule.lastConfirmed)}</span></div>` +
          (schedule.note
            ? `<div class="echo-schedule-row__note">${esc(schedule.note)}</div>`
            : '') +
          `</div>` +
          `<span class="echo-schedule-row__countdown${
            urgent ? ' echo-schedule-row__countdown--urgent' : ''
          }">${esc(countdown(at, now))}</span>` +
          `</div>`
        );
      })
      .join('');
  };

  // The permission prompt is only honoured from a user gesture, so it hangs off a
  // click rather than firing on mount.
  element.addEventListener('click', (event) => {
    const target = event.target as HTMLElement;

    if (target.closest('[name="permission"]')) {
      void requestPermission().then(renderPermission);
      return;
    }

    const toggle = target.closest<HTMLButtonElement>('.echo-switch');
    if (!toggle?.dataset.slot) return;

    const on = toggleSubscription(toggle.dataset.slot);
    toggle.setAttribute('aria-checked', String(on));
    if (on && permission() === 'default') void requestPermission().then(renderPermission);
  });

  renderPermission();
  render();
  const timer = window.setInterval(render, TICK_MS);

  return { element, destroy: () => window.clearInterval(timer) };
}
