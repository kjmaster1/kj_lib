//
import { IconProp } from '@fortawesome/fontawesome-svg-core';

export interface RadialState {
  visible: boolean;
  items: RadialMenuItem[];
  id: string; // To track which menu is open
}

export interface RadialMenuItem {
  id?: string;        // Added: Unique identifier for the item (used in callbacks)
  icon: string | IconProp;
  label: string;
  keepOpen?: boolean; // Added: If true, menu stays open after click
  isMore?: boolean;
  menu?: string;      // Sub-menu ID to open
  iconWidth?: number;
  iconHeight?: number;
}
