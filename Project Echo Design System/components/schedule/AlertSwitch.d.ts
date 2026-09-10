export interface AlertSwitchProps {
  on?: boolean;
  /** True when notifications are denied or unsupported — the switch cannot help then. */
  disabled?: boolean;
  onChange?: (on: boolean) => void;
  label?: string;
}

export declare function AlertSwitch(props: AlertSwitchProps): JSX.Element;
