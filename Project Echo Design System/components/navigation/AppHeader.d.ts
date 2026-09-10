import type { EchoTheme } from '../core/ThemePicker';

export interface AppHeaderProps {
  /** The wordmark. There is no logo asset in the source. */
  title?: string;
  theme?: EchoTheme;
  onThemeChange?: (theme: EchoTheme) => void;
}

export declare function AppHeader(props: AppHeaderProps): JSX.Element;
