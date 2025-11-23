import { IconProp } from '@fortawesome/fontawesome-svg-core';

export interface RadialState {
  visible: boolean;
  items: RadialMenuItem[];
  id: string; // To track which menu is open
}

export interface RadialMenuItem {
  icon: string | IconProp;
  label: string;
  isMore?: boolean;
  menu?: string;
  iconWidth?: number;
  iconHeight?: number;
}
