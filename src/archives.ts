import type { Station } from './types';

/**
 * Links out to the established archives.
 *
 * This app does not host recordings of voice or digital message traffic. Publishing the
 * contents of non-broadcast transmissions is the regulated act (docs/RESEARCH.md §5),
 * the hobby groups have been curating those recordings for decades, and duplicating
 * their holdings would add legal exposure and no value. So the archive view sends
 * people to them, by search, with the station named.
 */

export interface ArchiveLink {
  label: string;
  url: string;
  description: string;
}

function term(station: Station): string {
  // The designator is the reliable search key; the nickname is what most recordings are
  // actually filed under, so send both when they differ.
  return station.name === station.enigmaId
    ? station.enigmaId
    : `${station.enigmaId} ${station.name}`;
}

export function archiveLinks(station: Station): ArchiveLink[] {
  const query = encodeURIComponent(term(station));

  return [
    {
      label: 'Shortwave Radio Audio Archive',
      url: `https://shortwavearchive.com/search?q=${query}`,
      description: 'Dated off-air recordings contributed by listeners.',
    },
    {
      label: 'Internet Archive',
      url: `https://archive.org/search?query=${query}`,
      description: 'Long-form recordings and collections, including complete transmissions.',
    },
    {
      label: 'Signal Identification Wiki',
      url: `https://www.sigidwiki.com/index.php?search=${query}`,
      description: 'Reference waveforms, spectrograms and sample audio for identification.',
    },
    {
      label: 'Priyom.org',
      url: `https://priyom.org/search?q=${query}`,
      description: 'Logs, schedules and transmission history maintained by the community.',
    },
  ];
}
