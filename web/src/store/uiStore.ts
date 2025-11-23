import {create} from 'zustand';
import {devtools} from 'zustand/middleware';
import type {
  AlertProps,
  ContextMenuProps,
  GameDifficulty,
  InputProps,
  MenuSettings,
  ProgressState,
  RadialMenuItem,
  TextUiPayload,
  TextUiState
} from '../typings';

// -----------------------------------------------------------------------------
// Slices
// -----------------------------------------------------------------------------

interface MenuSlice {
  visible: boolean;
  data: MenuSettings | null;
  setMenu: (data: MenuSettings) => void;
  closeMenu: () => void;
}

interface InputSlice {
  visible: boolean;
  data: InputProps | null;
  openInput: (data: InputProps) => void;
  closeInput: () => void;
}

interface AlertSlice {
  visible: boolean;
  data: AlertProps | null;
  openAlert: (data: AlertProps) => void;
  closeAlert: () => void;
}

interface ContextSlice {
  visible: boolean;
  menu: ContextMenuProps | null;
  openContext: (menu: ContextMenuProps) => void;
  closeContext: () => void;
}

interface RadialSlice {
  visible: boolean;
  items: RadialMenuItem[];
  id: string;
  openRadial: (id: string, items: RadialMenuItem[]) => void;
  closeRadial: () => void;
}

interface SkillCheckSlice {
  visible: boolean;
  difficultyChain: GameDifficulty[];
  activeIndex: number;
  startSkillCheck: (difficulty: GameDifficulty | GameDifficulty[]) => void;
  incrementSkillCheck: () => void;
  closeSkillCheck: () => void;
}

interface ProgressSlice {
  visible: boolean;
  type: 'linear' | 'circular';
  label: string;
  duration: number;
  position: 'bottom' | 'middle';
  showPercentage: boolean;
  setProgress: (data: Omit<ProgressState, 'visible'>) => void;
  closeProgress: () => void;
}

interface TextUiSlice {
  visible: boolean;
  text: string;
  position: TextUiState['position'];
  icon?: TextUiState['icon'];
  iconColor?: string;
  setTextUi: (data: TextUiPayload) => void;
  hideTextUi: () => void;
}

// -----------------------------------------------------------------------------
// Main Store Interface
// -----------------------------------------------------------------------------

export interface UiState {
  menu: MenuSlice;
  input: InputSlice;
  alert: AlertSlice;
  context: ContextSlice;
  radial: RadialSlice;
  skillCheck: SkillCheckSlice;
  progress: ProgressSlice;
  textUi: TextUiSlice;
}

// -----------------------------------------------------------------------------
// Store Implementation
// -----------------------------------------------------------------------------

export const useUiStore = create<UiState>()(
  devtools((set) => ({
    // --- Menu ---
    menu: {
      visible: false,
      data: null,
      setMenu: (data) =>
        set((state) => ({menu: {...state.menu, visible: true, data}}), false, 'menu/set'),
      closeMenu: () =>
        set((state) => ({menu: {...state.menu, visible: false, data: null}}), false, 'menu/close'),
    },

    // --- Input (Dialog) ---
    input: {
      visible: false,
      data: null,
      openInput: (data) =>
        set((state) => ({input: {...state.input, visible: true, data}}), false, 'input/open'),
      closeInput: () =>
        set((state) => ({input: {...state.input, visible: false, data: null}}), false, 'input/close'),
    },

    // --- Alert ---
    alert: {
      visible: false,
      data: null,
      openAlert: (data) =>
        set((state) => ({alert: {...state.alert, visible: true, data}}), false, 'alert/open'),
      closeAlert: () =>
        set((state) => ({alert: {...state.alert, visible: false, data: null}}), false, 'alert/close'),
    },

    // --- Context Menu ---
    context: {
      visible: false,
      menu: null,
      openContext: (menu) =>
        set((state) => ({context: {...state.context, visible: true, menu}}), false, 'context/open'),
      closeContext: () =>
        set((state) => ({context: {...state.context, visible: false, menu: null}}), false, 'context/close'),
    },

    // --- Radial Menu ---
    radial: {
      visible: false,
      items: [],
      id: '',
      openRadial: (id, items) =>
        set((state) => ({radial: {...state.radial, visible: true, id, items}}), false, 'radial/open'),
      closeRadial: () =>
        set((state) => ({radial: {...state.radial, visible: false}}), false, 'radial/close'),
    },

    // --- Skill Check ---
    skillCheck: {
      visible: false,
      difficultyChain: [],
      activeIndex: 0,
      startSkillCheck: (difficulty) =>
        set(
          (state) => ({
            skillCheck: {
              ...state.skillCheck,
              visible: true,
              activeIndex: 0,
              difficultyChain: Array.isArray(difficulty) ? difficulty : [difficulty],
            },
          }),
          false,
          'skillCheck/start'
        ),
      incrementSkillCheck: () =>
        set(
          (state) => ({
            skillCheck: {...state.skillCheck, activeIndex: state.skillCheck.activeIndex + 1},
          }),
          false,
          'skillCheck/increment'
        ),
      closeSkillCheck: () =>
        set(
          (state) => ({skillCheck: {...state.skillCheck, visible: false, difficultyChain: []}}),
          false,
          'skillCheck/close'
        ),
    },

    // --- Progress ---
    progress: {
      visible: false,
      type: 'linear',
      label: '',
      duration: 0,
      position: 'bottom',
      showPercentage: false,
      setProgress: (data) =>
        set(
          (state) => ({
            progress: {...state.progress, ...data, visible: true},
          }),
          false,
          'progress/set'
        ),
      closeProgress: () =>
        set((state) => ({progress: {...state.progress, visible: false}}), false, 'progress/close'),
    },

    // --- TextUI ---
    textUi: {
      visible: false,
      text: '',
      position: 'right-center',
      icon: undefined,
      iconColor: undefined,
      setTextUi: (data) =>
        set(
          (state) => ({
            textUi: {
              ...state.textUi,
              visible: true,
              text: data.text,
              position: data.position || 'right-center',
              icon: data.icon,
              iconColor: data.iconColor,
            },
          }),
          false,
          'textUi/set'
        ),
      hideTextUi: () =>
        set((state) => ({textUi: {...state.textUi, visible: false}}), false, 'textUi/hide'),
    },
  }))
);
