import {Logger} from "../common/logger";
import { Cache } from "./cache";

export type IconProp = string | [string, string];

export interface AlertDialogProps {
  header: string;
  content: string;
  centered?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  overflow?: boolean;
  cancel?: boolean;
  labels?: { cancel?: string; confirm?: string };
}

export interface ContextMenuItem {
  title?: string;
  menu?: string;
  icon?: IconProp;
  iconColor?: string;
  image?: string;
  progress?: number;
  onSelect?: (args: any) => void;
  arrow?: boolean;
  description?: string;
  metadata?: string | { [key: string]: any } | string[];
  disabled?: boolean;
  readOnly?: boolean;
  event?: string;
  serverEvent?: string;
  args?: any;
}

export interface ContextMenuProps {
  id: string;
  title: string;
  menu?: string;
  onExit?: () => void;
  onBack?: () => void;
  canClose?: boolean;
  options: { [key: string]: ContextMenuItem } | ContextMenuItem[];
}

export interface MenuOptions {
  label: string;
  progress?: number;
  colorScheme?: string;
  icon?: IconProp;
  iconColor?: string;
  values?: string[] | { label: string; description: string }[];
  checked?: boolean;
  description?: string;
  defaultIndex?: number;
  args?: { [key: string]: any };
  close?: boolean;
}

export interface MenuProps {
  id: string;
  title: string;
  options: MenuOptions[];
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  disableInput?: boolean;
  canClose?: boolean;
  onClose?: (keyPressed?: 'Escape' | 'Backspace') => void;
  onSelected?: (selected: number, scrollIndex?: number, args?: any) => void;
  onSideScroll?: (selected: number, scrollIndex?: number, args?: any) => void;
  onCheck?: (selected: number, checked: boolean, args?: any) => void;
}

export interface NotifyProps {
  id?: string;
  title?: string;
  description?: string;
  duration?: number;
  showDuration?: boolean;
  position?: 'top' | 'top-right' | 'top-left' | 'bottom' | 'bottom-right' | 'bottom-left' | 'center-right' | 'center-left';
  type?: 'info' | 'warning' | 'success' | 'error';
  style?: { [key: string]: any };
  icon?: IconProp;
  iconAnimation?: 'spin' | 'spinPulse' | 'spinReverse' | 'pulse' | 'beat' | 'fade' | 'beatFade' | 'bounce' | 'shake';
  iconColor?: string;
  alignIcon?: 'top' | 'center';
}

export interface TextUIOptions {
  position?: 'right-center' | 'left-center' | 'top-center' | 'bottom-center';
  icon?: IconProp;
  iconColor?: string;
  style?: { [key: string]: any };
  alignIcon?: 'top' | 'center';
}

export interface SkillCheckDifficulty {
  areaSize: number;
  speedMultiplier: number;
}

export interface RadialItem {
  id: string;
  label: string;
  icon: IconProp;
  onSelect?: () => void;
  event?: string;
  serverEvent?: string;
  args?: any;
  keepOpen?: boolean;
  menu?: string; // Submenu ID
}

export interface RadialMenuProps {
  id: string;
  items: RadialItem[];
}

export class Interface {
  // Registries
  private static contextMenus: Record<string, ContextMenuProps> = {};
  private static openContextMenu: string | null = null;
  private static menuTick: number | null = null;

  private static registeredMenus: Record<string, MenuProps> = {};
  private static openMenu: MenuProps | null = null;

  private static radialMenus: Record<string, RadialMenuProps> = {};
  private static currentRadial: string | null = null;
  private static radialOpen = false;

  // Resolvers
  private static alertResolver: ((value: 'cancel' | 'confirm' | null) => void) | null = null;
  private static inputResolver: ((value: any[] | null) => void) | null = null;
  private static skillCheckResolver: ((value: boolean) => void) | null = null;

  // State
  // @ts-ignore
  private static isTextUIOpen = false;
  private static currentTextUI: string | null = null;
  private static keepInput = false;

  static init() {


    // Register the 'init' callback
    RegisterNuiCallbackType('init');
    on('__cfx_nui:init', (_: any, cb: (data: any) => void) => {
      Logger.info('UI Initialized');
      // Send back 'ok' or any data to resolve the promise in the UI
      cb('ok');
    });

    // Register the 'getConfig' callback
    RegisterNuiCallbackType('getConfig');
    on('__cfx_nui:getConfig', (_: any, cb: (data: any) => void) => {
      const config = {
        primaryColor: GetConvar('kj_lib:primaryColor', 'blue'),
        primaryShade: GetConvarInt('kj_lib:primaryShade', 6)
      };

      cb(config);
    });

    // --- ALERT ---
    RegisterNuiCallbackType('closeAlert');
    on('__cfx_nui:closeAlert', (data: any, cb: Function) => {
      cb(1);
      this.resetNuiFocus();
      if (this.alertResolver) this.alertResolver(data);
      this.alertResolver = null;
    });

    // --- CONTEXT MENU ---
    RegisterNuiCallbackType('openContext');
    on('__cfx_nui:openContext', (data: any, cb: Function) => {
      if (this.openContextMenu && this.contextMenus[this.openContextMenu]?.onBack) {
        this.contextMenus[this.openContextMenu].onBack!();
      }
      cb(1);
      this.showContext(data.id);
    });

    RegisterNuiCallbackType('closeContext');
    on('__cfx_nui:closeContext', (_: any, cb: Function) => {
      this.closeContext(cb);
    });

    RegisterNuiCallbackType('clickContext');
    on('__cfx_nui:clickContext', (id: number | string, cb: Function) => {
      cb(1);
      if (!this.openContextMenu) return;

      // Handle array or object indexing
      const menuData = this.contextMenus[this.openContextMenu];
      let item: any;

      // Adjust 0-based index from JS if necessary or match keys
      if (Array.isArray(menuData.options)) {
        item = menuData.options[Number(id)];
      } else {
        item = (menuData.options as any)[id];
      }

      if (!item) return;

      if (!item.event && !item.serverEvent && !item.onSelect) return;

      this.openContextMenu = null;
      SendNuiMessage(JSON.stringify({ action: 'hideContext' }));
      this.resetNuiFocus();

      if (item.onSelect) item.onSelect(item.args);
      if (item.event) emit(item.event, item.args);
      if (item.serverEvent) TriggerServerEvent(item.serverEvent, item.args);
    });

    // --- INPUT ---
    RegisterNuiCallbackType('inputData');
    on('__cfx_nui:inputData', (data: any[], cb: Function) => {
      cb(1);
      this.resetNuiFocus();
      if (this.inputResolver) this.inputResolver(data);
      this.inputResolver = null;
    });

    RegisterNuiCallbackType('closeInputDialog');
    on('__cfx_nui:closeInputDialog', (_: any, cb: Function) => {
      cb(1);
      this.resetNuiFocus();
      if (this.inputResolver) this.inputResolver(null);
      this.inputResolver = null;
    });

    // --- MENU ---
    RegisterNuiCallbackType('closeMenu');
    on('__cfx_nui:closeMenu', (data: any, cb: Function) => {
      cb(1);
      this.resetNuiFocus();
      if (this.openMenu?.onClose) this.openMenu.onClose(data);
      this.openMenu = null;
    });

    RegisterNuiCallbackType('changeSelected');
    on('__cfx_nui:changeSelected', (data: any, cb: Function) => {
      cb(1);
      if (!this.openMenu || !this.openMenu.onSelected) return;

      const rawSelectedIndex = data[0];
      const selectedIndex1Based = rawSelectedIndex + 1;

      const item = this.openMenu.options[rawSelectedIndex];

      if (!item) return;

      let args = item.args;

      if (args && typeof args !== 'object') {
        Logger.error('Menu args must be passed as a table');
        return;
      }

      if (!args) {
        args = {};
      }

      const scrollIndexProvided = data[1] !== null && data[1] !== undefined;

      if (scrollIndexProvided) {
        const value = data[2];
        if (value !== undefined) {
          args[value] = true;
        }
      }

      let finalScrollIndex = data[1];

      if (scrollIndexProvided && !args.isCheck) {
        finalScrollIndex += 1;
      }

      this.openMenu.onSelected(selectedIndex1Based, finalScrollIndex, args);
    });

    RegisterNuiCallbackType('confirmSelected');
    on('__cfx_nui:confirmSelected', (data: any, cb: Function) => {
      cb(1);
      if (!this.openMenu) return;

      // @ts-ignore
      const [selectedIndex, scrollIndex, checked] = data;
      // data[0] is index, data[1] is scrollIndex (optional), data[2] is checked (optional)

      const item = this.openMenu.options[selectedIndex];

      if (item.close !== false) {
        this.resetNuiFocus();
        this.openMenu = null;
      }

      if (this.openMenu?.onSelected) {
        this.openMenu.onSelected(selectedIndex + 1, scrollIndex !== undefined ? scrollIndex + 1 : undefined, item.args);
      }
    });

    RegisterNuiCallbackType('changeIndex');
    on('__cfx_nui:changeIndex', (data: any, cb: Function) => {
      cb(1);
      if (!this.openMenu?.onSideScroll) return;
      const [selectedIndex, scrollIndex] = data;
      const item = this.openMenu.options[selectedIndex];
      this.openMenu.onSideScroll(selectedIndex + 1, scrollIndex + 1, item.args);
    });

    RegisterNuiCallbackType('changeChecked');
    on('__cfx_nui:changeChecked', (data: any, cb: Function) => {
      cb(1);
      if (!this.openMenu?.onCheck) return;
      const [selectedIndex, checked] = data;
      const item = this.openMenu.options[selectedIndex];
      this.openMenu.onCheck(selectedIndex + 1, checked, item.args);
    });

    // --- SKILL CHECK ---
    RegisterNuiCallbackType('skillCheckOver');
    on('__cfx_nui:skillCheckOver', (success: boolean, cb: Function) => {
      cb(1);
      this.resetNuiFocus();
      if (this.skillCheckResolver) this.skillCheckResolver(success);
      this.skillCheckResolver = null;
    });

    // --- RADIAL MENU ---
    RegisterNuiCallbackType('radialClick');
    on('__cfx_nui:radialClick', (data: any, cb: Function) => {
      cb(1);
      const { itemId, menuId } = data;

      // Handle navigation if it's a submenu
      if (this.radialMenus[itemId]) {
        this.showRadial(itemId);
        return;
      }

      // Handle Selection
      const menu = this.radialMenus[menuId || this.currentRadial];
      if (!menu) return;

      const item = menu.items.find(i => i.id === itemId);
      if (item) {
        if (!item.keepOpen) this.hideRadial();
        if (item.onSelect) item.onSelect();
        if (item.event) emit(item.event, item.args);
        if (item.serverEvent) TriggerServerEvent(item.serverEvent, item.args);
      }
    });

    RegisterNuiCallbackType('radialClose');
    on('__cfx_nui:radialClose', (_: any, cb: Function) => {
      cb(1);
      this.hideRadial();
    });
  }

  // ============================================
  // NUI FOCUS HELPERS
  // ============================================

  static setNuiFocus(allowInput: boolean, disableCursor: boolean = false) {
    this.keepInput = IsNuiFocusKeepingInput();
    SetNuiFocus(true, !disableCursor);
    SetNuiFocusKeepInput(allowInput);
  }

  static resetNuiFocus() {
    SetNuiFocus(false, false);
    SetNuiFocusKeepInput(this.keepInput);
  }

  // ============================================
  // ALERT
  // ============================================

  static async alertDialog(data: AlertDialogProps): Promise<'cancel' | 'confirm' | null> {
    if (this.alertResolver) return null;

    this.setNuiFocus(false);
    SendNuiMessage(JSON.stringify({
      action: 'sendAlert',
      data: data
    }));

    return new Promise((resolve) => {
      this.alertResolver = resolve;
    });
  }

  // ============================================
  // CONTEXT MENU
  // ============================================

  static registerContext(context: ContextMenuProps) {
    this.contextMenus[context.id] = context;
  }

  static showContext(id: string) {
    const data = this.contextMenus[id];
    if (!data) {
      Logger.error(`No context menu with id ${id} found.`);
      return;
    }

    this.openContextMenu = id;
    this.setNuiFocus(false);

    SendNuiMessage(JSON.stringify({
      action: 'showContext',
      data: {
        title: data.title,
        canClose: data.canClose,
        menu: data.menu,
        options: data.options
      }
    }));
  }

  static hideContext(onExit: boolean = false) {
    this.closeContext(null, onExit);
  }

  private static closeContext(cb?: Function, onExit?: boolean) {
    if (cb) cb(1);
    this.resetNuiFocus();

    if (!this.openContextMenu) return;

    if ((cb || onExit) && this.contextMenus[this.openContextMenu]?.onExit) {
      this.contextMenus[this.openContextMenu].onExit!();
    }

    if (!cb) SendNuiMessage(JSON.stringify({ action: 'hideContext' }));
    this.openContextMenu = null;
  }

  // ============================================
  // INPUT
  // ============================================

  static async inputDialog(heading: string, rows: any[], options?: { allowCancel?: boolean }): Promise<any[] | null> {
    if (this.inputResolver) this.inputResolver(null);

    this.setNuiFocus(false);
    SendNuiMessage(JSON.stringify({
      action: 'openDialog',
      data: {
        heading,
        rows,
        options
      }
    }));

    return new Promise((resolve) => {
      this.inputResolver = resolve;
    });
  }

  // ============================================
  // MENU
  // ============================================

  static registerMenu(data: MenuProps) {
    this.registeredMenus[data.id] = data;
  }

  static showMenu(id: string, startIndex?: number) {
    const menu = this.registeredMenus[id];
    if (!menu) return Logger.error(`Menu ${id} not found`);

    if (menu.disableInput !== false) {
      if (this.menuTick !== null) clearTick(this.menuTick);

      this.menuTick = setTick(() => {
        DisablePlayerFiring(Cache.playerId, true);
        HudWeaponWheelIgnoreSelection();
        DisableControlAction(0, 140, true)
      });
    }

    this.openMenu = menu;
    this.setNuiFocus(menu.disableInput !== true, true); // Keep input true if we want to walk/move

    SendNuiMessage(JSON.stringify({
      action: 'setMenu',
      data: {
        position: menu.position,
        canClose: menu.canClose,
        title: menu.title,
        items: menu.options,
        startItemIndex: startIndex ? startIndex - 1 : 0
      }
    }));
  }

  static hideMenu(onExit: boolean = false) {
    if (!this.openMenu) return;

    if (this.menuTick !== null) {
      clearTick(this.menuTick);
      this.menuTick = null;
    }

    this.resetNuiFocus();
    if (onExit && this.openMenu.onClose) this.openMenu.onClose();

    SendNuiMessage(JSON.stringify({ action: 'closeMenu' }));
    this.openMenu = null;
  }

  // ============================================
  // NOTIFY
  // ============================================

  static notify(data: NotifyProps) {
    SendNuiMessage(JSON.stringify({
      action: 'notify',
      data: data
    }));
  }

  // ============================================
  // TEXT UI
  // ============================================

  static showTextUI(text: string, options: TextUIOptions = {}) {
    if (this.currentTextUI === text) return;
    this.currentTextUI = text;
    this.isTextUIOpen = true;

    SendNuiMessage(JSON.stringify({
      action: 'textUi',
      data: {
        text,
        ...options
      }
    }));
  }

  static hideTextUI() {
    SendNuiMessage(JSON.stringify({ action: 'textUiHide' }));
    this.isTextUIOpen = false;
    this.currentTextUI = null;
  }

  // ============================================
  // SKILL CHECK
  // ============================================

  static async skillCheck(difficulty: SkillCheckDifficulty | SkillCheckDifficulty[], inputs?: string[]): Promise<boolean> {
    if (this.skillCheckResolver) return false;

    this.setNuiFocus(false, true); // Focus NUI, disable cursor (mouse control for skillcheck usually not needed but keyboard is)

    SendNuiMessage(JSON.stringify({
      action: 'startSkillCheck',
      data: {
        difficulty,
        inputs
      }
    }));

    return new Promise((resolve) => {
      this.skillCheckResolver = resolve;
    });
  }

  static cancelSkillCheck() {
    if (!this.skillCheckResolver) return;
    SendNuiMessage(JSON.stringify({ action: 'skillCheckCancel' }));
    this.skillCheckResolver(false);
    this.skillCheckResolver = null;
    this.resetNuiFocus();
  }

  // ============================================
  // RADIAL MENU
  // ============================================

  static registerRadial(menu: RadialMenuProps) {
    this.radialMenus[menu.id] = menu;
  }

  static showRadial(id: string) {
    const menu = this.radialMenus[id];
    if (!menu) return Logger.error(`Radial menu ${id} not found`);

    this.currentRadial = id;
    this.radialOpen = true;

    // Set NUI Focus (Keep Input true so we can move while selecting if desired, or false to stop)
    this.setNuiFocus(true, true);
    SetCursorLocation(0.5, 0.5);

    SendNuiMessage(JSON.stringify({
      action: 'openRadialMenu',
      data: {
        items: menu.items,
        id: menu.id
      }
    }));
  }

  static hideRadial() {
    if (!this.radialOpen) return;
    this.radialOpen = false;
    this.currentRadial = null;
    this.resetNuiFocus();
    SendNuiMessage(JSON.stringify({ action: 'openRadialMenu', data: false }));
  }

  // ============================================
  // CLIPBOARD
  // ============================================

  static copyToClipboard(text: string) {
    SendNuiMessage(JSON.stringify({
      action: 'copyToClipboard',
      data: { content: text }
    }));
  }
}
