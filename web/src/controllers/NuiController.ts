// web/src/controllers/NuiController.ts
import React from 'react';
import { useShallow } from 'zustand/react/shallow'; // FIXED: v5 Import
import { useNuiEvent } from '../hooks/useNuiEvent';
import { useUiStore, UiState } from '../store/uiStore'; // Ensure UiState is exported
import { isEnvBrowser } from '../utils/misc';
import type { MenuSettings, InputProps } from '../typings';
import {useNotificationListener} from "../hooks/useNotificationListener";

const NuiController: React.FC = () => {
  const { setMenu, closeMenu, openInput, closeInput } = useUiStore(
    useShallow((state: UiState) => ({
      setMenu: state.menu.setMenu,
      closeMenu: state.menu.closeMenu,
      openInput: state.input.openInput,
      closeInput: state.input.closeInput,
    }))
  );

  /**
   * A Higher-Order Handler to add Logging and Error Safety.
   */
  const handle = <T,>(action: string, handler: (data: T) => void) => {
    return (data: T) => {
      if (isEnvBrowser()) {
        console.debug(`[NUI] Event Received: ${action}`, data);
      }
      try {
        handler(data);
      } catch (error) {
        console.error(`[NUI] Error processing ${action}:`, error);
      }
    };
  };

  // Menu Events
  useNuiEvent<MenuSettings>('setMenu', handle('setMenu', setMenu));
  useNuiEvent('closeMenu', handle('closeMenu', closeMenu));

  // Dialog Events
  useNuiEvent<InputProps>('openDialog', handle('openDialog', openInput));
  useNuiEvent('closeInputDialog', handle('closeInputDialog', closeInput));

  useNotificationListener();

  return null;
};

export default NuiController;
