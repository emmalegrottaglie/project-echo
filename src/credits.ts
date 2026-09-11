import { openSheet, type Sheet } from './ui';

/**
 * Who this archive belongs to, and what the licence requires.
 *
 * Two obligations meet here. Priyom.org publish under CC BY-NC-SA 4.0, which makes
 * attribution, non-commercial use and share-alike conditions of using the data rather
 * than courtesies — and an adaptation has to say what it changed. And the plain fact
 * that 141 stations of sourced identity, status, schedules and frequencies are decades
 * of unpaid work by two volunteer groups, which a row of `[1] [2]` footnote marks does
 * not acknowledge in any way a reader notices.
 *
 * Reached from the per-station credit line, from the archive header and from the help
 * screen, rather than being a page nobody opens.
 *
 * Neither project publishes a donation link, so this does not invent one. What they ask
 * for is observations, which is a more useful thing to send them anyway.
 */

const CONTENT = `
  <p class="echo-help__lede">
    Almost everything this app knows about a station came from somewhere else. Two
    volunteer groups have spent decades assembling it, and this is a way of reading
    their work rather than a replacement for it.
  </p>

  <h4>Priyom.org</h4>
  <p>
    An international group of radio enthusiasts who came together in 2010, when the
    station now in this app's live view started behaving strangely enough to be worth
    following. They log transmissions, publish schedules, and maintain a station page
    for every designator in the archive. Identity, operator, activity status and every
    imported schedule here came from them.
  </p>
  <p>
    They publish no donation link and ask for something more useful: reception reports.
    Their community is the <strong>#priyom</strong> channel on
    <a href="https://libera.chat/" target="_blank" rel="noreferrer">Libera.Chat</a>, and
    logs are welcome there.
    <a href="https://priyom.org/" target="_blank" rel="noreferrer">priyom.org</a>
  </p>

  <h4>ENIGMA 2000</h4>
  <p>
    The European Numbers Information Gathering and Monitoring Association, who maintain
    the designator system this whole archive is organised by — the letter-and-number
    codes like E11 and S28, where the first letter is the language or mode. Their Active
    Stations List cross-checks the roster here, and their newsletters, published every
    two months, are how a change in a station's behaviour usually first gets recorded.
    <a href="http://www.signalshed.com/" target="_blank" rel="noreferrer">signalshed.com</a>
  </p>

  <h4>The licence, and what it requires</h4>
  <p>
    Priyom publish under
    <a href="https://creativecommons.org/licenses/by-nc-sa/4.0/" target="_blank" rel="noreferrer">
      Creative Commons Attribution-NonCommercial-ShareAlike 4.0</a>.
    The station data in this app is adapted from theirs, so it carries that same licence
    and three obligations come with it: they are credited, this app takes no money of any
    kind, and anyone redistributing the data must do so under the same terms.
  </p>
  <p>
    The licence also requires an adaptation to say what it changed. The tables were
    reformatted into JSON, the merged month columns expanded into twelve frequencies per
    slot, day-and-time text encoded as RFC 5545 rules, and rows the source marks as
    outdated left out. Nothing was invented, and the transformation can be re-run.
  </p>

  <h4>Also used</h4>
  <p>
    The receiver list is Pierre Ynard's, auto-generated at
    <a href="http://rx.linkfanel.net/" target="_blank" rel="noreferrer">rx.linkfanel.net</a>
    for the dyatlov map maker. Propagation comes from
    <a href="https://prop.kc2g.com/" target="_blank" rel="noreferrer">prop.kc2g.com</a>,
    which conditions IRI-2016 on live ionosonde data. The world map is
    <a href="https://www.naturalearthdata.com/" target="_blank" rel="noreferrer">Natural Earth</a>
    110m land, public domain. The typeface is JetBrains Mono under the SIL Open Font
    License. The receivers themselves belong to whoever put them on the air.
  </p>

  <h4>This app</h4>
  <p>
    Free and open source, no advertising, no paid tier and no donations — the only
    support links here are theirs. The code is MIT licensed; the station data is not, and
    carries the licence above.
  </p>
`;

export function openCredits(): Sheet {
  const sheet = openSheet('Credits and licence', '', undefined);
  sheet.body.innerHTML = `<div class="echo-help">${CONTENT}</div>`;
  return sheet;
}
