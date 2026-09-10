import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Receiver storage, including the migration from the pre-list format.
 *
 * `normaliseHost` has already shipped one bug: an empty field normalised to ':8073',
 * which is truthy, so a hostless receiver was saved and then offered in the picker.
 * Both the guard and the migration that prunes such rows are pinned here.
 */

/** A localStorage stand-in, so these tests need no DOM environment. */
class MemoryStorage {
  private store = new Map<string, string>();

  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }
  setItem(key: string, value: string): void {
    this.store.set(key, String(value));
  }
  removeItem(key: string): void {
    this.store.delete(key);
  }
  clear(): void {
    this.store.clear();
  }
  key(index: number): string | null {
    return [...this.store.keys()][index] ?? null;
  }
  get length(): number {
    return this.store.size;
  }
}

const storage = new MemoryStorage();
vi.stubGlobal('localStorage', storage);

const {
  isValidGrid,
  listReceivers,
  normaliseHost,
  removeReceiver,
  saveReceiver,
  selectedReceiver,
  selectReceiver,
} = await import('../src/receiver');

function receiver(host: string, label = host) {
  return {
    id: host,
    label,
    host,
    grid: '',
    location: '',
    kind: 'kiwisdr' as const,
    notes: null,
  };
}

beforeEach(() => {
  storage.clear();
});

describe('normaliseHost', () => {
  it('adds the default Kiwi port to a bare hostname', () => {
    expect(normaliseHost('example.com')).toBe('example.com:8073');
  });

  it('keeps an explicit port', () => {
    expect(normaliseHost('example.com:8074')).toBe('example.com:8074');
  });

  it('strips a scheme and any path', () => {
    expect(normaliseHost('http://example.com:8073/?f=4625usb')).toBe('example.com:8073');
  });

  it('returns nothing for an empty field, rather than a bare port', () => {
    expect(normaliseHost('')).toBe('');
    expect(normaliseHost('   ')).toBe('');
  });
});

describe('isValidGrid', () => {
  it('accepts four- and six-character Maidenhead squares', () => {
    expect(isValidGrid('KO85')).toBe(true);
    expect(isValidGrid('em37fd')).toBe(true);
  });

  it('rejects anything else', () => {
    expect(isValidGrid('')).toBe(false);
    expect(isValidGrid('K085')).toBe(false);
    expect(isValidGrid('KO8')).toBe(false);
    expect(isValidGrid('ZZ99')).toBe(false);
  });
});

describe('receiver list', () => {
  it('saves, selects and lists a receiver', () => {
    saveReceiver(receiver('a.example:8073', 'Alpha'));

    expect(listReceivers().map((entry) => entry.host)).toEqual(['a.example:8073']);
    expect(selectedReceiver()?.label).toBe('Alpha');
  });

  it('replaces rather than duplicates the same host', () => {
    saveReceiver(receiver('a.example:8073', 'First'));
    saveReceiver(receiver('a.example:8073', 'Second'));

    expect(listReceivers()).toHaveLength(1);
    expect(selectedReceiver()?.label).toBe('Second');
  });

  it('falls back to the first receiver when the selection is removed', () => {
    saveReceiver(receiver('a.example:8073'));
    saveReceiver(receiver('b.example:8073'));
    selectReceiver('b.example:8073');
    removeReceiver('b.example:8073');

    expect(selectedReceiver()?.host).toBe('a.example:8073');
  });

  it('returns null with nothing saved', () => {
    expect(selectedReceiver()).toBeNull();
    expect(listReceivers()).toEqual([]);
  });

  it('prunes a stored receiver that names no host', () => {
    // What the earlier normaliseHost bug wrote.
    storage.setItem('echo.receivers', JSON.stringify([receiver(':8073'), receiver('ok.example:8073')]));

    expect(listReceivers().map((entry) => entry.host)).toEqual(['ok.example:8073']);
  });

  it('migrates the single-receiver format and drops the old key', () => {
    storage.setItem('echo.receiver', JSON.stringify(receiver('legacy.example:8073', 'Legacy')));

    expect(listReceivers().map((entry) => entry.host)).toEqual(['legacy.example:8073']);
    expect(selectedReceiver()?.label).toBe('Legacy');
    expect(storage.getItem('echo.receiver')).toBeNull();
  });

  it('does not migrate a hostless legacy value', () => {
    storage.setItem('echo.receiver', JSON.stringify(receiver(':8073')));

    expect(listReceivers()).toEqual([]);
  });

  it('recovers from unparseable storage instead of throwing', () => {
    storage.setItem('echo.receivers', '{not json');

    expect(listReceivers()).toEqual([]);
  });
});

describe('selection fallback', () => {
  it('commits the fallback so display and behaviour cannot diverge', () => {
    saveReceiver(receiver('a.example:8073', 'Alpha'));
    saveReceiver(receiver('b.example:8073', 'Bravo'));
    // A selection left over from a receiver that is no longer saved.
    localStorage.setItem('echo.receiver.selected', 'gone.example:8073');

    const chosen = selectedReceiver();

    expect(chosen?.host).toBe('a.example:8073');
    // The whole point: the next read, and any connection, agree with what was shown.
    expect(localStorage.getItem('echo.receiver.selected')).toBe('a.example:8073');
    expect(selectedReceiver()?.host).toBe('a.example:8073');
  });

  it('writes nothing when there is no receiver to fall back to', () => {
    expect(selectedReceiver()).toBeNull();
    expect(localStorage.getItem('echo.receiver.selected')).toBeNull();
  });
});
