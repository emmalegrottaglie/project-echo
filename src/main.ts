import './style.css';
import { checkDue, POLL_MS } from './alerts';
import { STATIONS } from './data/stations';
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

type ViewFactory = () => { element: HTMLElement; destroy: () => void };

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

  app.innerHTML = `
    <header class="echo-header">
      <h1 class="echo-wordmark">Project Echo</h1>
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

  app.querySelector('.echo-themes')!.addEventListener('click', (event) => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-theme]');
    if (button?.dataset.theme) applyTheme(button.dataset.theme);
  });

  let current: { element: HTMLElement; destroy: () => void } | null = null;

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

  const navigate = (): void => {
    const key = location.hash.replace('#', '') || 'live';
    const view = VIEWS[key] ?? VIEWS['live']!;

    try {
      current?.destroy();
    } catch (error) {
      // A failed teardown must not block navigation, or one broken view traps the user.
      console.error(`view teardown failed`, error);
    }
    current = null;

    try {
      current = view.factory();
      main.replaceChildren(current.element);
    } catch (error) {
      renderFailure(key, error);
    }

    for (const tab of app.querySelectorAll<HTMLButtonElement>('.echo-tab')) {
      if (tab.dataset.view === key) tab.setAttribute('aria-current', 'page');
      else tab.removeAttribute('aria-current');
    }
  };

  app.querySelector('.echo-tabbar')!.addEventListener('click', (event) => {
    const tab = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-view]');
    if (tab?.dataset.view) location.hash = tab.dataset.view;
  });

  window.addEventListener('hashchange', navigate);
  navigate();

  // Alerts belong to the shell, not the schedule view: a reminder is useless if it
  // only fires while the user is looking at the schedule.
  checkDue(STATIONS);
  window.setInterval(() => checkDue(STATIONS), POLL_MS);
}

mountShell();
