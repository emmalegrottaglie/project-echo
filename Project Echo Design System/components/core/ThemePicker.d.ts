import type { CSSProperties } from 'react';

export type EchoTheme = 'phosphor' | 'amber' | 'midnight' | 'nightvision';

/** Four dark themes. There is no light theme and no dark/light toggle. */
export interface ThemePickerProps {
  value?: EchoTheme;
  onChange?: (theme: EchoTheme) => void;
  style?: CSSProperties;
}

export declare function ThemePicker(props: ThemePickerProps): JSX.Element;
