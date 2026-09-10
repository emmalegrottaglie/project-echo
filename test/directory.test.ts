import { describe, expect, it } from 'vitest';
import { parseDirectory } from '../server/directory.mjs';

/**
 * The upstream receiver list.
 *
 * It is a JavaScript assignment with trailing commas, published for a map tool rather
 * than for us, so its shape is the thing most likely to shift without warning. These
 * cases are taken from the real file.
 */

const REAL_SHAPE = `
// KiwiSDR.com receiver list for dyatlov map maker
var kiwisdr_com = [
	{
		"status":"active",
		"offline":"no",
		"name":"2-30MHZ SDR #2, VK5ARG | Near Tarlee, South Australia",
		"bands":"2000000-30000000",
		"users":"2",
		"users_max":"8",
		"gps":"(-34.273700, 138.771000)",
		"grid":"PF95JR",
		"loc":"Near Tarlee, South Australia",
		"snr":"44,44",
		"url":"http://kiwisdr.areg.org.au:8074"
	},
	{
		"status":"active",
		"offline":"yes",
		"name":"A node that is down",
		"bands":"0-30000000",
		"users":"0",
		"users_max":"4",
		"grid":"JO01",
		"loc":"Nowhere",
		"snr":"12,12",
		"url":"http://down.example:8073"
	},
]
`;

describe('parseDirectory', () => {
  it('parses the assignment despite the trailing comma', () => {
    expect(parseDirectory(REAL_SHAPE)).toHaveLength(2);
  });

  it('normalises the fields the picker needs', () => {
    const [first] = parseDirectory(REAL_SHAPE);

    expect(first).toMatchObject({
      host: 'kiwisdr.areg.org.au:8074',
      grid: 'PF95JR',
      location: 'Near Tarlee, South Australia',
      users: 2,
      usersMax: 8,
      offline: false,
    });
  });

  it('reads the frequency coverage in kHz, not Hz', () => {
    const [first] = parseDirectory(REAL_SHAPE);

    // 2–30 MHz covers 4625 kHz, which is the whole point of the filter.
    expect(first.bandsKhz).toEqual([2000, 30000]);
  });

  it('takes the first figure of the two-band SNR estimate', () => {
    expect(parseDirectory(REAL_SHAPE)[0].snr).toBe(44);
  });

  it('parses the parenthesised GPS pair, and tolerates its absence', () => {
    const rows = parseDirectory(REAL_SHAPE);

    expect(rows[0].gps).toEqual([-34.2737, 138.771]);
    expect(rows[1].gps).toBeNull();
  });

  it('marks an offline node rather than dropping it at parse time', () => {
    // The filter belongs to the query, not the parse: a caller asking for everything
    // should still see what the upstream published.
    expect(parseDirectory(REAL_SHAPE)[1].offline).toBe(true);
  });

  it('drops an entry with no usable URL', () => {
    const broken = 'var kiwisdr_com = [ { "name":"no url", "url":"" }, ]';
    expect(parseDirectory(broken)).toEqual([]);
  });

  it('defaults a URL without a port to the standard Kiwi port', () => {
    const noPort = 'var kiwisdr_com = [ { "name":"x", "url":"http://plain.example" }, ]';
    expect(parseDirectory(noPort)[0].host).toBe('plain.example:8073');
  });

  it('throws on something that is not the expected format', () => {
    expect(() => parseDirectory('<html>gone</html>')).toThrow(/expected format/);
  });
});
