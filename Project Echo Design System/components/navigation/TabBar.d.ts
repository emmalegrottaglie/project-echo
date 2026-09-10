/**
 * Bottom navigation, three tabs.
 *
 */
export interface TabBarProps {
  value?: 'live' | 'schedule' | 'archive';
  onChange?: (value: string) => void;
  /** Override only to demonstrate states; the app has exactly three tabs. */
  tabs?: { value: string; label: string }[];
}

export declare function TabBar(props: TabBarProps): JSX.Element;
