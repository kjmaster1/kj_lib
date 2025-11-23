//
import React from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useNuiEvent } from '../hooks/useNuiEvent';
import { useUiStore, UiState } from '../store/uiStore';
import { isEnvBrowser } from '../utils/misc';
import { useNotificationListener } from '../hooks/useNotificationListener';
import type {
  MenuSettings,
  InputProps,
  AlertProps,
  ContextMenuProps,
  RadialMenuItem,
  GameDifficulty,
  TextUiPayload,
  ProgressState,
} from '../typings';

const NuiController: React.FC = () => {
  const {
    // Menu
    setMenu,
    closeMenu,
    // Input
    openInput,
    closeInput,
    // Alert
    openAlert,
    closeAlert,
    // Context
    openContext,
    closeContext,
    // Radial
    openRadial,
    closeRadial,
    // Skill Check
    startSkillCheck,
    closeSkillCheck,
    // Progress
    setProgress,
    closeProgress,
    // TextUI
    setTextUi,
    hideTextUi,
  } = useUiStore(
    useShallow((state: UiState) => ({
      setMenu: state.menu.setMenu,
      closeMenu: state.menu.closeMenu,
      openInput: state.input.openInput,
      closeInput: state.input.closeInput,
      openAlert: state.alert.openAlert,
      closeAlert: state.alert.closeAlert,
      openContext: state.context.openContext,
      closeContext: state.context.closeContext,
      openRadial: state.radial.openRadial,
      closeRadial: state.radial.closeRadial,
      startSkillCheck: state.skillCheck.startSkillCheck,
      closeSkillCheck: state.skillCheck.closeSkillCheck,
      setProgress: state.progress.setProgress,
      closeProgress: state.progress.closeProgress,
      setTextUi: state.textUi.setTextUi,
      hideTextUi: state.textUi.hideTextUi,
    }))
  );

  /**
   * A Higher-Order Handler to add Logging and Error Safety.
   */
  const handle = <T>(action: string, handler: (data: T) => void) => {
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

  // --- Menu Events ---
  useNuiEvent<MenuSettings>('setMenu', handle('setMenu', setMenu));
  useNuiEvent('closeMenu', handle('closeMenu', closeMenu));

  // --- Dialog (Input) Events ---
  useNuiEvent<InputProps>('openDialog', handle('openDialog', openInput));
  useNuiEvent('closeInputDialog', handle('closeInputDialog', closeInput));

  // --- Alert Events ---
  useNuiEvent<AlertProps>('sendAlert', handle('sendAlert', openAlert));
  useNuiEvent('closeAlert', handle('closeAlert', closeAlert));

  // --- Context Menu Events ---
  useNuiEvent<ContextMenuProps>('showContext', handle('showContext', openContext));
  useNuiEvent('closeContext', handle('closeContext', closeContext));

  // --- Radial Menu Events ---
  useNuiEvent<{ id?: string; items: RadialMenuItem[] }>('openRadialMenu',
    handle('openRadialMenu', (data) => openRadial(data.id || 'radial_menu', data.items))
  );
  useNuiEvent('closeRadialMenu', handle('closeRadialMenu', closeRadial));

  // --- Skill Check Events ---
  // FIXED: Extract 'inputs' and pass to startSkillCheck
  useNuiEvent<{ difficulty: GameDifficulty | GameDifficulty[]; inputs?: string[] }>('startSkillCheck',
    handle('startSkillCheck', (data) => startSkillCheck(data.difficulty, data.inputs))
  );
  useNuiEvent('skillCheckCancel', handle('skillCheckCancel', closeSkillCheck));

  // --- Progress Events ---
  useNuiEvent<Omit<ProgressState, 'visible'>>('progress', handle('progress', setProgress));
  useNuiEvent('progressCancel', handle('progressCancel', closeProgress));

  useNuiEvent<Omit<ProgressState, 'visible'>>('circleProgress',
    handle('circleProgress', (data) => setProgress({ ...data, type: 'circular' }))
  );

  // --- TextUI Events ---
  useNuiEvent<TextUiPayload>('textUi', handle('textUi', setTextUi));
  useNuiEvent('textUiHide', handle('textUiHide', hideTextUi));

  // --- Notifications ---
  useNotificationListener();

  return null;
};

export default NuiController;
