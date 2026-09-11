import './style.css';
import { checkDue, POLL_MS } from './alerts';
import { available } from './api';
import { allStations, loadCachedStations, refreshStations } from './data/stations';
import { helpHasBeenSeen, openHelp } from './help';
import { listReceivers } from './receiver';
import { gapNotice } from './ui';
import { liveView } from './views/live';
import { scheduleView } from './views/schedule';
import { stationsView } from './views/stations';

/**
 * App shell: header, tab content, bottom tab bar.
 *
 * Three tabs, hash-routed — the hash is kept so links still work. A view owns its own
 * audio graph, timers and intervals and hands back a `destroy`, which the shell calls
 * on every navigation: leaving a WebSocket to a volunteer's receiver open behind a
 * hidden view is exactly the kind of thing that gets a node to block us.
 */

interface View {
  element: HTMLElement;
  destroy: () => void;
  /**
   * Applies the part of the hash after the view key, for a view that is already
   * mounted. A view without one is remounted instead.
   *
   * This exists so `#archive/S28` can open a station without tearing the archive down
   * and rebuilding it — which would lose the search text, the tier filter and the
   * scroll position every time someone opened or closed a station.
   */
  route?: (param: string) => void;
}

type ViewFactory = (param: string) => View;

const VIEWS: Record<string, { label: string; factory: ViewFactory }> = {
  live: { label: 'Live', factory: liveView },
  schedule: { label: 'Schedule', factory: scheduleView },
  archive: { label: 'Archive', factory: stationsView },
};

/** Swatches are the accent of each theme, so the control shows what it selects. */
const THEMES: ReadonlyArray<{ value: string; swatch: string }> = [
  { value: 'phosphor', swatch: '#4ade80' },
  { value: 'amber', swatch: '#fbbf24' },
  { value: 'midnight', swatch: '#38bdf8' },
  { value: 'nightvision', swatch: '#f87171' },
];

const THEME_KEY = 'echo.theme';

function mountShell(): void {
  const app = document.querySelector<HTMLElement>('#app');
  if (!app) throw new Error('#app missing from index.html');

  // Station data before any view reads it. The cache is whatever the last launch
  // fetched; the refresh below is for the next one, which is why neither blocks here.
  loadCachedStations();

  app.innerHTML = `
    <header class="echo-header">
      <h1 class="echo-wordmark">Project Echo</h1>
      <button class="echo-help-button" type="button" name="help" aria-label="What is this?">?</button>
      <div class="echo-themes" role="radiogroup" aria-label="Theme">
        ${THEMES.map(
          (theme) =>
            `<button class="echo-theme" type="button" role="radio" data-theme="${theme.value}"` +
            ` aria-checked="false" aria-label="${theme.value}" style="--swatch:${theme.swatch}">` +
            `<span></span></button>`,
        ).join('')}
      </div>
    </header>
    <main></main>
    <nav class="echo-tabbar">
      ${Object.entries(VIEWS)
        .map(
          ([key, view]) =>
            `<button class="echo-tab" type="button" data-view="${key}">${view.label}</button>`,
        )
        .join('')}
    </nav>
  `;

  const main = app.querySelector<HTMLElement>('main')!;

  /**
   * Theme changes are instant and explicitly have no transition: a recolour of every
   * surface is a full-page repaint, and it fights the waterfall.
   */
  const applyTheme = (theme: string): void => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(THEME_KEY, theme);
    for (const button of app.querySelectorAll<HTMLButtonElement>('.echo-theme')) {
      button.setAttribute('aria-checked', String(button.dataset.theme === theme));
    }
  };

  applyTheme(localStorage.getItem(THEME_KEY) ?? 'phosphor');

  app.querySelector<HTMLButtonElement>('[name="help"]')!.addEventListener('click', () => {
    openHelp();
  });

  app.querySelector('.echo-themes')!.addEventListener('click', (event) => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-theme]');
    if (button?.dataset.theme) applyTheme(button.dataset.theme);
  });

  let current: View | null = null;
  let currentKey: string | null = null;

  /**
   * A view that throws while mounting would otherwise leave an empty `main` with
   * nothing said anywhere — the failure would look like a blank screen. Naming it, and
   * leaving the tab bar reachable so another view can be tried, is the difference
   * between a bug and a dead app.
   */
  const renderFailure = (key: string, error: unknown): void => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`view "${key}" failed to mount`, error);

    main.innerHTML =
      `<section class="view"><div class="echo-scroll"><div class="echo-detail__body">` +
      gapNotice(
        'This view failed to load',
        `${key}: ${message}. The other tabs still work. If it persists, reload — and if ` +
          'it survives a reload, the console carries the stack.',
      ) +
      `</div></div></section>`;
  };

  const markTab = (key: string): void => {
    for (const tab of app.querySelectorAll<HTMLButtonElement>('.echo-tab')) {
      if (tab.dataset.view === key) tab.setAttribute('aria-current', 'page');
      else tab.removeAttribute('aria-current');
    }
  };

  const navigate = (): void => {
    // `#archive/S28` is the view key and a parameter for it. Anything unrecognised
    // falls back to the live view rather than showing an empty shell.
    const [requested = '', param = ''] = location.hash.replace('#', '').split('/');
    const key = VIEWS[requested] ? requested : 'live';
    const view = VIEWS[key]!;

    if (key === currentKey && current?.route) {
      current.route(param);
      markTab(key);
      return;
    }

    try {
      current?.destroy();
    } catch (error) {
      // A failed teardown must not block navigation, or one broken view traps the user.
      console.error(`view teardown failed`, error);
    }
    current = null;
    currentKey = key;

    try {
      current = view.factory(param);
      main.replaceChildren(current.element);
    } catch (error) {
      renderFailure(key, error);
    }

    markTab(key);
  };

  app.querySelector('.echo-tabbar')!.addEventListener('click', (event) => {
    const tab = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-view]');
    if (tab?.dataset.view) location.hash = tab.dataset.view;
  });

  window.addEventListener('hashchange', navigate);
  navigate();

  // Offered once, to someone who has not got a receiver yet and has not seen it. Not
  // a tour: one screen, and the `?` brings it back whenever.
  if (!helpHasBeenSeen() && listReceivers().length === 0) openHelp();

  // Alerts belong to the shell, not the schedule view: a reminder is useless if it
  // only fires while the user is looking at the schedule.
  checkDue(allStations());
  window.setInterval(() => checkDue(allStations()), POLL_MS);

  // Corrections reach an installed app without a release. Nothing waits on this and
  // nothing reports it: running with no server at all is a supported configuration.
  void available().then((ok) => (ok ? refreshStations() : false));
}

mountShell();
