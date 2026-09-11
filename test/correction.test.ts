import { describe, expect, it } from 'vitest';
import { FIELDS, issueBody, issueUrl } from '../src/correction';
import type { Station } from '../src/types';

/**
 * A correction report has one job: arrive actionable. A maintainer reading it in a
 * GitHub notification, without the app open, must be able to see what the archive
 * currently claims, what the reporter says it should be, and on what evidence.
 */

function station(overrides: Partial<Station> = {}): Station {
  return {
    enigmaId: 'S28',
    name: 'The Buzzer',
    aliases: [],
    language: 'Slavic voice',
    operator: 'Russian military, 69th communications hub',
    tier: 'live',
    marker: null,
    markerPeriodSec: 3.1,
    lastConfirmed: '2026-09-10',
    lore: { text: 'Something', quotedFrom: null },
    frequencies: [
      {
        khz: 4625,
        mode: 'USB',
        timeOfDay: null,
        lastConfirmed: '2025-11-15',
        sourceUrl: 'https://en.wikipedia.org/wiki/UVB-76',
        disputed: false,
      },
    ],
    schedules: [],
    sites: [],
    activeFrom: null,
    activeUntil: null,
    sourceUrls: ['https://example.org/'],
    ...overrides,
  };
}

const field = (key: string) => FIELDS.find((entry) => entry.key === key)!;

describe('the report body', () => {
  it('carries what the archive currently claims, so the report stands alone', () => {
    const body = issueBody(station(), field('frequency'), '4625 kHz, moved to LSB', 'https://priyom.org/x');

    expect(body).toContain('**Station:** S28 The Buzzer');
    expect(body).toContain('**Field:** A frequency');
    expect(body).toContain('4625 kHz USB');
    expect(body).toContain('confirmed 2025-11-15');
    expect(body).toContain('**Should be:** 4625 kHz, moved to LSB');
    expect(body).toContain('**Source:** https://priyom.org/x');
  });

  it('says plainly when the archive records nothing, rather than leaving a blank', () => {
    const body = issueBody(station({ frequencies: [] }), field('frequency'), 'x', 'https://e.org/');
    expect(body).toContain('none recorded');
  });

  it('omits the current line for a field that has no single value', () => {
    const body = issueBody(station(), field('other'), 'x', 'https://e.org/');
    expect(body).not.toContain('**Currently recorded:**');
  });

  it('does not print a name twice for a station that has none', () => {
    const body = issueBody(station({ enigmaId: 'V10', name: 'V10' }), field('other'), 'x', 'https://e.org/');
    expect(body).toContain('**Station:** V10\n');
  });
});

describe('the issue link', () => {
  it('points at this repository and prefills the whole report', () => {
    const url = new URL(issueUrl(station(), field('status'), 'off the air', 'https://priyom.org/x'));

    expect(url.origin + url.pathname).toBe(
      'https://github.com/emmalegrottaglie/project-echo/issues/new',
    );
    expect(url.searchParams.get('title')).toBe('S28: whether it is still on the air');
    expect(url.searchParams.get('labels')).toBe('data');
    expect(url.searchParams.get('body')).toContain('**Should be:** off the air');
  });

  it('escapes a report that would otherwise break the query string', () => {
    const url = new URL(
      issueUrl(station(), field('other'), 'uses & and = and #hash', 'https://e.org/?a=1&b=2'),
    );
    expect(url.searchParams.get('body')).toContain('uses & and = and #hash');
    expect(url.searchParams.get('body')).toContain('https://e.org/?a=1&b=2');
  });
});

describe('which fields are upstream', () => {
  it('marks the ones that came from Priyom, so the reporter is pointed there', () => {
    expect(field('frequency').upstream).toBe(true);
    expect(field('schedule').upstream).toBe(true);
    expect(field('status').upstream).toBe(true);
  });

  it('leaves this project to own what this project added', () => {
    // Transmitter sites were researched here, not imported.
    expect(field('site').upstream).toBe(false);
    expect(field('other').upstream).toBe(false);
  });
});
