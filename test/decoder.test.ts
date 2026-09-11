import { describe, expect, it } from 'vitest';
import { families } from '../src/decoder';
import { describeDesignator, designatorPrefix } from '../src/data/stations';

/**
 * The designator system is the archive's organising principle, and 141 rows of E11 and
 * S06c read as inventory codes until someone says so. These pin the decoding, including
 * the designators that do not follow the pattern — explaining structure that is not
 * there would be worse than explaining nothing.
 */

describe('designatorPrefix', () => {
  it('takes the leading letter', () => {
    expect(designatorPrefix('E11')).toBe('E');
    expect(designatorPrefix('S06c')).toBe('S');
    expect(designatorPrefix('M12')).toBe('M');
  });

  it('reads HM as its own family rather than as Morse', () => {
    // HM01 interleaves spoken groups with data. Taking the first letter alone would
    // file it under H correctly by luck; taking the first two is what is meant.
    expect(designatorPrefix('HM01')).toBe('H');
    expect(designatorPrefix('M01')).toBe('M');
  });
});

describe('describeDesignator', () => {
  it('reads a plain designator out in parts', () => {
    expect(describeDesignator('E11')).toBe('E for English voice, 11 for the station.');
  });

  it('names the trailing letter as a variant', () => {
    expect(describeDesignator('S06c')).toBe(
      'S for Slavic voice, 06 for the station, c for a variant of it.',
    );
  });

  it('refuses to invent structure for the irregular ones', () => {
    for (const id of ['HM01', 'XPA2', 'SK01', 'XPB']) {
      expect(describeDesignator(id)).toContain('does not split');
    }
  });

  it('still names the family of an irregular designator', () => {
    expect(describeDesignator('XPA2')).toContain('Digital (other)');
    expect(describeDesignator('HM01')).toContain('hybrid');
  });

  it('leaves the acronym alone, since "digital (fsk)" is simply wrong', () => {
    expect(describeDesignator('F01')).toBe('F for Digital (FSK), 01 for the station.');
    expect(describeDesignator('P03')).toContain('(PSK)');
  });
});

describe('families', () => {
  it('counts the roster rather than hardcoding a legend', () => {
    const all = families();
    const total = all.reduce((sum, family) => sum + family.count, 0);

    // Every station in the archive belongs to exactly one listed family.
    expect(total).toBe(141);
    expect(all.every((family) => family.count > 0)).toBe(true);
  });

  it('puts the commonest family first', () => {
    const counts = families().map((family) => family.count);
    expect([...counts].sort((a, b) => b - a)).toEqual(counts);
  });

  it('gives every family a meaning', () => {
    expect(families().every((family) => family.meaning.length > 0)).toBe(true);
  });
});
