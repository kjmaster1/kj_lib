// src/client/interface.ts
import {Logger} from '../common';
import {Cache} from './cache';

// -----------------------------------------------------------------------------
// Types & Interfaces
// -----------------------------------------------------------------------------

export type IconProp = string | [string, string];

export interface NuiMessage<T = any> {
  action: string;
  data?: T;
}

// --- Alert Types ---
export interface AlertDialogProps {
  header: string;
  content: string;
  centered?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  overflow?: boolean;
  cancel?: boolean;
  labels?: { cancel?: string; confirm?: string };
}

// --- Context Menu Types ---
export interface ContextMenuItem {
  title?: string;
  menu?: string; // Submenu ID
  icon?: IconProp;
  iconColor?: string;
  image?: string;
  progress?: number;
  onSelect?: (args: unknown) => void;
  arrow?: boolean;
  description?: string;
  metadata?: string | Record<string, unknown> | string[];
  disabled?: boolean;
  readOnly?: boolean;
  event?: string;
  serverEvent?: string;
  args?: unknown;
}

export interface ContextMenuProps {
  id: string;
  title: string;
  menu?: string; // Parent menu ID
  onExit?: () => void;
  onBack?: () => void;
  canClose?: boolean;
  options: Record<string, ContextMenuItem> | ContextMenuItem[];
}

// --- List Menu Types ---
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
  args?: Record<string, unknown>;
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
  onSelected?: (selected: number, scrollIndex?: number, args?: unknown) => void;
  onSideScroll?: (selected: number, scrollIndex?: number, args?: unknown) => void;
  onCheck?: (selected: number, checked: boolean, args?: unknown) => void;
}

// --- Notification & HUD Types ---
export interface NotifyProps {
  id?: string;
  title?: string;
  description?: string;
  duration?: number;
  showDuration?: boolean;
  position?: 'top' | 'top-right' | 'top-left' | 'bottom' | 'bottom-right' | 'bottom-left' | 'center-right' | 'center-left';
  type?: 'info' | 'warning' | 'success' | 'error';
  icon?: IconProp;
  iconAnimation?: 'spin' | 'spinPulse' | 'spinReverse' | 'pulse' | 'beat' | 'fade' | 'beatFade' | 'bounce' | 'shake';
  iconColor?: string;
  alignIcon?: 'top' | 'center';
}

export interface TextUIOptions {
  position?: 'right-center' | 'left-center' | 'top-center' | 'bottom-center';
  icon?: IconProp;
  iconColor?: string;
  alignIcon?: 'top' | 'center';
}

// --- Skill & Radial Types ---
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
  args?: unknown;
  keepOpen?: boolean;
  menu?: string; // Submenu ID
}

export interface RadialMenuProps {
  id: string;
  items: RadialItem[];
}

// -----------------------------------------------------------------------------
// Core NUI Service (Handles Communication & Focus)
// -----------------------------------------------------------------------------

class NuiManager {
  private keepInput = false;

  constructor() {
    RegisterNuiCallbackType('init');
    on('__cfx_nui:init', (_: any, cb: (data: any) => void) => {
      Logger.info('UI Initialized via NuiManager');
      cb('ok');
    });

    RegisterNuiCallbackType('getConfig');
    on('__cfx_nui:getConfig', (_: any, cb: (data: any) => void) => {
      cb({
        primaryColor: GetConvar('kj_lib:primaryColor', 'blue'),
        primaryShade: GetConvarInt('kj_lib:primaryShade', 6)
      });
    });
  }

  public send<T = any>(action: string, data?: T) {
    SendNuiMessage(JSON.stringify({action, data}));
  }

  public setFocus(focus: boolean, cursor: boolean = false, keepInput: boolean = false) {
    if (focus) {
      this.keepInput = IsNuiFocusKeepingInput();
    }
    SetNuiFocus(focus, cursor);
    SetNuiFocusKeepInput(keepInput);

    // If disabling focus, attempt to restore previous input state or default to false
    if (!focus) {
      SetNuiFocusKeepInput(this.keepInput);
    }
  }

  public registerCallback<T = any>(name: string, handler: (data: T, cb: (resp: any) => void) => void) {
    RegisterNuiCallbackType(name);
    on(`__cfx_nui:${name}`, (data: T, cb: (resp: any) => void) => {
      handler(data, cb);
    });
  }
}

const Nui = new NuiManager();

// -----------------------------------------------------------------------------
// Feature Services
// -----------------------------------------------------------------------------

class DialogService {
  private resolver: ((value: any) => void) | null = null;

  constructor() {
    Nui.registerCallback('closeAlert', (data: any, cb) => {
      cb(1);
      Nui.setFocus(false);
      this.resolve(data);
    });

    Nui.registerCallback('inputData', (data: any[], cb) => {
      cb(1);
      Nui.setFocus(false);
      this.resolve(data);
    });

    Nui.registerCallback('closeInputDialog', (_, cb) => {
      cb(1);
      Nui.setFocus(false);
      this.resolve(null);
    });
  }

  private resolve(value: any) {
    if (this.resolver) {
      this.resolver(value);
      this.resolver = null;
    }
  }

  public async alert(data: AlertDialogProps): Promise<'cancel' | 'confirm' | null> {
    if (this.resolver) return null; // Prevent overlapping dialogs

    Nui.setFocus(true, true, false);
    Nui.send('sendAlert', data);

    return new Promise(resolve => {
      this.resolver = resolve;
    });
  }

  public async input(heading: string, rows: any[], options?: { allowCancel?: boolean }): Promise<any[] | null> {
    if (this.resolver) this.resolver(null); // Cancel previous if strictly needed

    Nui.setFocus(true, true, false);
    Nui.send('openDialog', {heading, rows, options});

    return new Promise(resolve => {
      this.resolver = resolve;
    });
  }
}

class MenuService {
  private contexts: Record<string, ContextMenuProps> = {};
  private menus: Record<string, MenuProps> = {};
  private radials: Record<string, RadialMenuProps> = {};

  private activeContext: string | null = null;
  private activeMenu: MenuProps | null = null;
  private activeRadial: string | null = null;

  private menuTick: number | null = null;

  constructor() {
    this.registerContextCallbacks();
    this.registerListCallbacks();
    this.registerRadialCallbacks();
  }

  // --- Context Internal ---
  private registerContextCallbacks() {
    Nui.registerCallback('openContext', (data: { id: string }, cb) => {
      if (this.activeContext && this.contexts[this.activeContext]?.onBack) {
        this.contexts[this.activeContext].onBack!();
      }
      cb(1);
      this.showContext(data.id);
    });

    Nui.registerCallback('closeContext', (_, cb) => {
      cb(1);
      this.closeContext();
    });

    Nui.registerCallback('clickContext', (id: number | string, cb) => {
      cb(1);
      if (!this.activeContext) return;

      const menu = this.contexts[this.activeContext];
      const item = Array.isArray(menu.options)
        ? menu.options[Number(id)]
        : menu.options[id];

      if (!item) return;

      // Close unless it's just a display item? usually context closes on click
      this.closeContext(false);

      if (item.onSelect) item.onSelect(item.args);
      if (item.event) emit(item.event, item.args);
      if (item.serverEvent) TriggerServerEvent(item.serverEvent, item.args);
    });
  }

  // --- List Internal ---
  private registerListCallbacks() {
    Nui.registerCallback('closeMenu', (_, cb) => {
      cb(1);
      this.closeMenu();
    });

    Nui.registerCallback('changeSelected', (data: any, cb) => {
      cb(1);
      if (!this.activeMenu?.onSelected) return;

      const [rawIndex, scrollIndex, checkValue] = data;
      const index = rawIndex + 1; // Lua 1-based standard compatibility

      const item = this.activeMenu.options[rawIndex];
      const args = item?.args || {};

      if (checkValue !== undefined) args[checkValue] = true;

      // Logic ported from original: Scroll index adjustment
      const finalScroll = (scrollIndex !== undefined && !args.isCheck)
        ? scrollIndex + 1
        : scrollIndex;

      this.activeMenu.onSelected(index, finalScroll, args);
    });

    Nui.registerCallback('confirmSelected', (data: any, cb) => {
      cb(1);
      if (!this.activeMenu) return;

      const [rawIndex, scrollIndex] = data;
      const item = this.activeMenu.options[rawIndex];

      if (item.close !== false) this.closeMenu();

      if (this.activeMenu.onSelected) {
        this.activeMenu.onSelected(rawIndex + 1, scrollIndex !== undefined ? scrollIndex + 1 : undefined, item.args);
      }
    });

    Nui.registerCallback('changeIndex', (data: any, cb) => {
      cb(1);
      if (!this.activeMenu?.onSideScroll) return;
      const [selectedIndex, scrollIndex] = data;
      const item = this.activeMenu.options[selectedIndex];
      this.activeMenu.onSideScroll(selectedIndex + 1, scrollIndex + 1, item.args);
    });

    Nui.registerCallback('changeChecked', (data: any, cb) => {
      cb(1);
      if (!this.activeMenu?.onCheck) return;
      const [selectedIndex, checked] = data;
      const item = this.activeMenu.options[selectedIndex];
      this.activeMenu.onCheck(selectedIndex + 1, checked, item.args);
    });
  }

  // --- Radial Internal ---
  private registerRadialCallbacks() {
    Nui.registerCallback('radialClick', (data: { itemId: string, menuId?: string }, cb) => {
      cb(1);
      const {itemId, menuId} = data;

      // Submenu navigation
      if (this.radials[itemId]) {
        this.showRadial(itemId);
        return;
      }

      // Item Action
      const menu = this.radials[menuId || this.activeRadial || ''];
      if (!menu) return;

      const item = menu.items.find(i => i.id === itemId);
      if (!item) return;

      if (!item.keepOpen) this.closeRadial();
      if (item.onSelect) item.onSelect();
      if (item.event) emit(item.event, item.args);
      if (item.serverEvent) TriggerServerEvent(item.serverEvent, item.args);
    });

    Nui.registerCallback('radialClose', (_, cb) => {
      cb(1);
      this.closeRadial();
    });
  }

  // --- Public API ---

  public registerContext(ctx: ContextMenuProps) {
    this.contexts[ctx.id] = ctx;
  }

  public showContext(id: string) {
    const ctx = this.contexts[id];
    if (!ctx) return Logger.error(`Context ${id} not found`);

    this.activeContext = id;
    Nui.setFocus(true, true, false);
    Nui.send('showContext', {
      title: ctx.title,
      canClose: ctx.canClose,
      menu: ctx.menu,
      options: ctx.options
    });
  }

  public closeContext(triggerExitCallback = true) {
    if (this.activeContext && triggerExitCallback) {
      this.contexts[this.activeContext]?.onExit?.();
    }
    this.activeContext = null;
    Nui.setFocus(false);
    Nui.send('hideContext');
  }

  public registerMenu(menu: MenuProps) {
    this.menus[menu.id] = menu;
  }

  public showMenu(id: string, startIndex?: number) {
    const menu = this.menus[id];
    if (!menu) return Logger.error(`Menu ${id} not found`);

    this.activeMenu = menu;

    // Handle Control Disabling
    if (menu.disableInput !== false) {
      if (this.menuTick) clearTick(this.menuTick);
      this.menuTick = setTick(() => {
        DisablePlayerFiring(Cache.get().playerId, true);
        HudWeaponWheelIgnoreSelection();
        DisableControlAction(0, 140, true);
      });
    }

    // Allow input (movement) if disableInput is false
    Nui.setFocus(true, false, menu.disableInput !== true);

    Nui.send('setMenu', {
      position: menu.position,
      canClose: menu.canClose,
      title: menu.title,
      items: menu.options,
      startItemIndex: startIndex ? startIndex - 1 : 0
    });
  }

  public closeMenu() {
    if (this.menuTick) {
      clearTick(this.menuTick);
      this.menuTick = null;
    }
    if (this.activeMenu?.onClose) this.activeMenu.onClose();

    this.activeMenu = null;
    Nui.setFocus(false);
    Nui.send('closeMenu');
  }

  public registerRadial(menu: RadialMenuProps) {
    this.radials[menu.id] = menu;
  }

  public showRadial(id: string) {
    if (!this.radials[id]) return Logger.error(`Radial ${id} not found`);

    this.activeRadial = id;
    Nui.setFocus(true, true, true); // Keep input for movement
    SetCursorLocation(0.5, 0.5);

    Nui.send('openRadialMenu', {items: this.radials[id].items, id});
  }

  public closeRadial() {
    this.activeRadial = null;
    Nui.setFocus(false);
    Nui.send('openRadialMenu', false);
  }
}

class HudService {
  private skillResolver: ((val: boolean) => void) | null = null;

  constructor() {
    Nui.registerCallback('skillCheckOver', (success: boolean, cb) => {
      cb(1);
      Nui.setFocus(false);
      if (this.skillResolver) {
        this.skillResolver(success);
        this.skillResolver = null;
      }
    });
  }

  public notify(data: NotifyProps) {
    Nui.send('notify', data);
  }

  public showTextUI(text: string, options: TextUIOptions = {}) {
    Nui.send('textUi', {text, ...options});
  }

  public hideTextUI() {
    Nui.send('textUiHide');
  }

  public copyToClipboard(text: string) {
    Nui.send('copyToClipboard', {content: text});
  }

  public async skillCheck(difficulty: SkillCheckDifficulty | SkillCheckDifficulty[], inputs?: string[]): Promise<boolean> {
    if (this.skillResolver) return false;

    Nui.setFocus(true, false, true); // Focus NUI, No Cursor, Keep Input (for keys)
    Nui.send('startSkillCheck', {difficulty, inputs});

    return new Promise(resolve => {
      this.skillResolver = resolve;
    });
  }

  public cancelSkillCheck() {
    if (this.skillResolver) {
      this.skillResolver(false);
      this.skillResolver = null;
      Nui.send('skillCheckCancel');
      Nui.setFocus(false);
    }
  }
}

// -----------------------------------------------------------------------------
// Facade (Exported API)
// -----------------------------------------------------------------------------

const Dialogs = new DialogService();
const Menus = new MenuService();
const Hud = new HudService();

export class Interface {
  static init() {
    // No-op, initialized by service instantiation or NuiManager
    Logger.info('Interface Services Ready');
  }

  // Facade methods for backward compatibility or cleanliness
  static alertDialog = Dialogs.alert.bind(Dialogs);
  static inputDialog = Dialogs.input.bind(Dialogs);

  static registerContext = Menus.registerContext.bind(Menus);
  static showContext = Menus.showContext.bind(Menus);
  static hideContext = Menus.closeContext.bind(Menus);

  static registerMenu = Menus.registerMenu.bind(Menus);
  static showMenu = Menus.showMenu.bind(Menus);
  static hideMenu = Menus.closeMenu.bind(Menus);

  static registerRadial = Menus.registerRadial.bind(Menus);
  static showRadial = Menus.showRadial.bind(Menus);
  static hideRadial = Menus.closeRadial.bind(Menus);

  static notify = Hud.notify.bind(Hud);
  static showTextUI = Hud.showTextUI.bind(Hud);
  static hideTextUI = Hud.hideTextUI.bind(Hud);
  static copyToClipboard = Hud.copyToClipboard.bind(Hud);

  static skillCheck = Hud.skillCheck.bind(Hud);
  static cancelSkillCheck = Hud.cancelSkillCheck.bind(Hud);
}
