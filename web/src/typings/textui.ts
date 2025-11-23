// web/src/typings/textui.ts
import { IconProp } from '@fortawesome/fontawesome-svg-core';

export type TextUiPosition = 'right-center' | 'left-center' | 'top-center' | 'bottom-center';

export interface TextUiState {
  visible: boolean;
  text: string;
  position: TextUiPosition;
  icon?: IconProp;
  iconColor?: string;
}

export interface TextUiPayload {
  text: string;
  position?: TextUiPosition;
  icon?: IconProp;
  iconColor?: string;
  alignIcon?: 'top' | 'center';
}
