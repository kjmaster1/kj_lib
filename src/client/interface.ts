// src/client/interface.ts
import { Logger } from '../common';
import { Cache } from './cache';

// =============================================================================
// 1. Core Architecture (Reusable NUI Logic)
// =============================================================================

/**
 * A generic wrapper to handle NUI communication boilerplate.
 * This standardizes how your client script talks to the React UI.
 */
class Nui {
  /**
   * Register a callback from the UI.
   * @param event The event name (without __cfx_nui prefix)
   * @param handler The function to run. Return value is sent back to UI.
   */
  static on<T = unknown, R = unknown>(event: string, handler: (data: T) => R | Promise<R>): void {
    RegisterNuiCallbackType(event);
    on(`__cfx_nui:${event}`, async (data: T, cb: (response: any) => void) => {
      try {
        const result = await handler(data);
        cb(result ?? 'ok');
      } catch (err) {
        Logger.error(`[NUI] Error in callback '${event}':`, err);
        cb({ error: true, message: err instanceof Error ? err.message : 'Unknown error' });
      }
    });
  }

  /**
   * Send data to the UI.
   * @param action The specific action identifier for the React reducer/listener
   * @param data The payload
   */
  static send<T = unknown>(action: string, data?: T): void {
    SendNuiMessage(JSON.stringify({ action, data }));
  }

  /**
   * Helper to set focus with optional cursor and input keep.
   */
  static focus(hasKeyboard: boolean, hasCursor: boolean, keepInput = false): void {
    SetNuiFocus(hasKeyboard, hasCursor);
    SetNuiFocusKeepInput(keepInput);
  }
}

// =============================================================================
// 2. Types & Interfaces (Domain Layer)
// =============================================================================

export type IconProp = string | [string, string];

// --- Alert & Dialog ---
export interface AlertDialogProps {
  header: string;
  content: string;
  centered?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  overflow?: boolean;
  cancel?: boolean;
  labels?: { cancel?: string; confirm?: string };
}

// --- Menus ---
export interface MenuItemBase {
  label?: string; // Standardized 'label' vs 'title' usage
  description?: string;
  icon?: IconProp;
  iconColor?: string;
  disabled?: boolean;
  args?: Record<string, unknown>;
}

export interface ContextMenuItem extends MenuItemBase {
  title?: string; // Legacy support
  menu?: string;
  image?: string;
  progress?: number;
  onSelect?: (args: unknown) => void;
  arrow?: boolean;
  metadata?: string | Record<string, unknown> | string[];
  readOnly?: boolean;
  event?: string;
  serverEvent?: string;
}

export interface ContextMenuProps {
  id: string;
  title: string;
  menu?: string;
  onExit?: () => void;
  onBack?: () => void;
  canClose?: boolean;
  options: Record<string, ContextMenuItem> | ContextMenuItem[];
}

export interface MenuOptions extends MenuItemBase {
  progress?: number;
  colorScheme?: string;
  values?: string[] | { label: string; description: string }[];
  checked?: boolean;
  defaultIndex?: number;
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

// --- Radial ---
export interface RadialItem {
  id: string;
  label: string;
  icon: IconProp;
  onSelect?: () => void;
  event?: string;
  serverEvent?: string;
  args?: unknown;
  keepOpen?: boolean;
  menu?: string;
}

export interface RadialMenuProps {
  id: string;
  items: RadialItem[];
}

// --- HUD ---
export interface NotifyProps {
  id?: string;
  title?: string;
  description?: string;
  duration?: number;
  showDuration?: boolean;
  position?: 'top' | 'top-right' | 'top-left' | 'bottom' | 'bottom-right' | 'bottom-left' | 'center-right' | 'center-left';
  type?: 'info' | 'warning' | 'success' | 'error';
  icon?: IconProp;
  iconAnimation?: string;
  iconColor?: string;
  alignIcon?: 'top' | 'center';
}

export interface TextUIOptions {
  position?: 'right-center' | 'left-center' | 'top-center' | 'bottom-center';
  icon?: IconProp;
  iconColor?: string;
  alignIcon?: 'top' | 'center';
}

export interface SkillCheckDifficulty {
  areaSize: number;
  speedMultiplier: number;
}

// =============================================================================
// 3. Services (Business Logic)
// =============================================================================

class DialogService {
  private activeResolver: ((value: any) => void) | null = null;

  constructor() {
    // Consolidated generic close handler for all dialog types
    const handleClose = (data: any) => {
      Nui.focus(false, false);
      this.resolve(data);
      return 1;
    };

    Nui.on('closeAlert', handleClose);
    Nui.on('inputData', handleClose);
    Nui.on('closeInputDialog', () => handleClose(null));
  }

  private resolve(value: any) {
    if (this.activeResolver) {
      this.activeResolver(value);
      this.activeResolver = null;
    }
  }

  public async alert(data: AlertDialogProps): Promise<'cancel' | 'confirm' | null> {
    if (this.activeResolver) return null; // Prevent overlapping dialogs

    Nui.focus(true, true);
    Nui.send('sendAlert', data);

    return new Promise((resolve) => {
      this.activeResolver = resolve;
    });
  }

  public async input(heading: string, rows: any[], options?: { allowCancel?: boolean }): Promise<any[] | null> {
    // If a dialog is already open, we resolve it with null to "cancel" it before opening new one
    if (this.activeResolver) this.resolve(null);

    Nui.focus(true, true);
    Nui.send('openDialog', { heading, rows, options });

    return new Promise((resolve) => {
      this.activeResolver = resolve;
    });
  }
}

class MenuService {
  private contexts: Map<string, ContextMenuProps> = new Map();
  private menus: Map<string, MenuProps> = new Map();
  private radials: Map<string, RadialMenuProps> = new Map();

  private activeContext: string | null = null;
  private activeMenu: MenuProps | null = null;
  private activeRadial: string | null = null;

  private controlTick: number | null = null;

  constructor() {
    this.registerContextCallbacks();
    this.registerListCallbacks();
    this.registerRadialCallbacks();
  }

  // --- Helpers ---

  /**
   * Starts a game loop to block controls while a menu is open.
   * This is cleaner than inline anonymous functions.
   */
  private startControlBlocker() {
    if (this.controlTick !== null) return;

    this.controlTick = setTick(() => {
      const playerId = Cache.get().playerId;
      DisablePlayerFiring(playerId, true);
      HudWeaponWheelIgnoreSelection();
      DisableControlAction(0, 140, true); // Melee Light
      DisableControlAction(0, 1, true);   // Mouse Look (sometimes needed)
      DisableControlAction(0, 2, true);   // Mouse Look
    });
  }

  private stopControlBlocker() {
    if (this.controlTick !== null) {
      clearTick(this.controlTick);
      this.controlTick = null;
    }
  }

  // --- Context Handlers ---

  private registerContextCallbacks() {
    Nui.on<{ id: string }>('openContext', (data) => {
      if (this.activeContext) {
        this.contexts.get(this.activeContext)?.onBack?.();
      }
      this.showContext(data.id);
    });

    Nui.on('closeContext', () => this.closeContext());

    Nui.on<number | string>('clickContext', (id) => {
      if (!this.activeContext) return;

      const menu = this.contexts.get(this.activeContext);
      if (!menu) return;

      const item = Array.isArray(menu.options)
        ? menu.options[Number(id)]
        : menu.options[id];

      if (!item) return;

      this.closeContext(false); // Close NUI

      if (item.onSelect) item.onSelect(item.args);
      if (item.event) emit(item.event, item.args);
      if (item.serverEvent) TriggerServerEvent(item.serverEvent, item.args);
    });
  }

  // --- List Handlers ---

  private registerListCallbacks() {
    Nui.on('closeMenu', () => this.closeMenu());

    Nui.on<[number, number, string?]>('changeSelected', (data) => {
      if (!this.activeMenu?.onSelected) return;

      const [rawIndex, scrollIndex, checkValue] = data;
      const index = rawIndex + 1; // Lua 1-based index conversion
      const item = this.activeMenu.options[rawIndex];
      const args = item?.args || {};

      if (checkValue !== undefined) args[checkValue] = true;

      // Adjust scroll index if not a checkbox
      const finalScroll = (scrollIndex !== undefined && !args.isCheck)
        ? scrollIndex + 1
        : scrollIndex;

      this.activeMenu.onSelected(index, finalScroll, args);
    });

    Nui.on<[number, number]>('confirmSelected', (data) => {
      if (!this.activeMenu) return;
      const [rawIndex, scrollIndex] = data;
      const item = this.activeMenu.options[rawIndex];

      if (item.close !== false) this.closeMenu();

      this.activeMenu.onSelected?.(
        rawIndex + 1,
        scrollIndex !== undefined ? scrollIndex + 1 : undefined,
        item.args
      );
    });

    Nui.on<[number, number]>('changeIndex', ([selectedIndex, scrollIndex]) => {
      if (!this.activeMenu?.onSideScroll) return;
      const item = this.activeMenu.options[selectedIndex];
      this.activeMenu.onSideScroll(selectedIndex + 1, scrollIndex + 1, item.args);
    });

    Nui.on<[number, boolean]>('changeChecked', ([selectedIndex, checked]) => {
      if (!this.activeMenu?.onCheck) return;
      const item = this.activeMenu.options[selectedIndex];
      this.activeMenu.onCheck(selectedIndex + 1, checked, item.args);
    });
  }

  // --- Radial Handlers ---

  private registerRadialCallbacks() {
    Nui.on<{ itemId: string, menuId?: string }>('radialClick', ({ itemId, menuId }) => {
      if (this.radials.has(itemId)) {
        this.showRadial(itemId); // Open Submenu
        return;
      }

      const activeId = menuId || this.activeRadial || '';
      const menu = this.radials.get(activeId);
      if (!menu) return;

      const item = menu.items.find(i => i.id === itemId);
      if (!item) return;

      if (!item.keepOpen) this.closeRadial();

      if (item.onSelect) item.onSelect();
      if (item.event) emit(item.event, item.args);
      if (item.serverEvent) TriggerServerEvent(item.serverEvent, item.args);
    });

    Nui.on('radialClose', () => this.closeRadial());
  }

  // --- Public API ---

  public registerContext(ctx: ContextMenuProps) {
    this.contexts.set(ctx.id, ctx);
  }

  public showContext(id: string) {
    const ctx = this.contexts.get(id);
    if (!ctx) return Logger.error(`Context ${id} not found`);

    this.activeContext = id;
    Nui.focus(true, true);
    Nui.send('showContext', {
      title: ctx.title,
      canClose: ctx.canClose,
      menu: ctx.menu,
      options: ctx.options
    });
  }

  public closeContext(triggerExitCallback = true) {
    if (this.activeContext && triggerExitCallback) {
      this.contexts.get(this.activeContext)?.onExit?.();
    }
    this.activeContext = null;
    Nui.focus(false, false);
    Nui.send('hideContext');
  }

  public registerMenu(menu: MenuProps) {
    this.menus.set(menu.id, menu);
  }

  public showMenu(id: string, startIndex?: number) {
    const menu = this.menus.get(id);
    if (!menu) return Logger.error(`Menu ${id} not found`);

    this.activeMenu = menu;

    if (menu.disableInput !== false) {
      this.startControlBlocker();
    }

    // If input is NOT disabled, we keep input focus in game so they can walk/drive
    Nui.focus(true, false, menu.disableInput !== true);

    Nui.send('setMenu', {
      position: menu.position,
      canClose: menu.canClose,
      title: menu.title,
      items: menu.options,
      startItemIndex: startIndex ? startIndex - 1 : 0
    });
  }

  public closeMenu() {
    this.stopControlBlocker();

    if (this.activeMenu?.onClose) this.activeMenu.onClose();
    this.activeMenu = null;

    Nui.focus(false, false);
    Nui.send('closeMenu');
  }

  public registerRadial(menu: RadialMenuProps) {
    this.radials.set(menu.id, menu);
  }

  public showRadial(id: string) {
    if (!this.radials.has(id)) return Logger.error(`Radial ${id} not found`);

    this.activeRadial = id;
    Nui.focus(true, true, true); // Keep input for movement
    SetCursorLocation(0.5, 0.5); // Center cursor

    Nui.send('openRadialMenu', { items: this.radials.get(id)!.items, id });
  }

  public closeRadial() {
    this.activeRadial = null;
    Nui.focus(false, false);
    Nui.send('openRadialMenu', false);
  }
}

class HudService {
  private skillResolver: ((val: boolean) => void) | null = null;

  constructor() {
    Nui.on<boolean>('skillCheckOver', (success) => {
      Nui.focus(false, false);
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
    Nui.send('textUi', { text, ...options });
  }

  public hideTextUI() {
    Nui.send('textUiHide');
  }

  public copyToClipboard(text: string) {
    Nui.send('copyToClipboard', { content: text });
  }

  public async skillCheck(difficulty: SkillCheckDifficulty | SkillCheckDifficulty[], inputs?: string[]): Promise<boolean> {
    if (this.skillResolver) return false;

    // Focus NUI, No Cursor, Keep Input (for key presses in skill check)
    Nui.focus(true, false, true);
    Nui.send('startSkillCheck', { difficulty, inputs });

    return new Promise((resolve) => {
      this.skillResolver = resolve;
    });
  }

  public cancelSkillCheck() {
    if (this.skillResolver) {
      this.skillResolver(false);
      this.skillResolver = null;
      Nui.send('skillCheckCancel');
      Nui.focus(false, false);
    }
  }
}

// =============================================================================
// 4. Facade (Initialization & Export)
// =============================================================================

// Instantiate Services
const Dialogs = new DialogService();
const Menus = new MenuService();
const Hud = new HudService();

// Init Base NUI Handlers
Nui.on('init', () => Logger.info('UI Initialized'));
Nui.on('getConfig', () => ({
  primaryColor: GetConvar('kj_lib:primaryColor', 'blue'),
  primaryShade: GetConvarInt('kj_lib:primaryShade', 6)
}));

/**
 * Main Interface Export
 * Acts as a static Facade for the underlying service singletons.
 */
export class Interface {
  static init() {
    Logger.info('Interface Services Ready');
  }

  // Dialogs
  static alertDialog = Dialogs.alert.bind(Dialogs);
  static inputDialog = Dialogs.input.bind(Dialogs);

  // Context Menu
  static registerContext = Menus.registerContext.bind(Menus);
  static showContext = Menus.showContext.bind(Menus);
  static hideContext = Menus.closeContext.bind(Menus);

  // List Menu
  static registerMenu = Menus.registerMenu.bind(Menus);
  static showMenu = Menus.showMenu.bind(Menus);
  static hideMenu = Menus.closeMenu.bind(Menus);

  // Radial Menu
  static registerRadial = Menus.registerRadial.bind(Menus);
  static showRadial = Menus.showRadial.bind(Menus);
  static hideRadial = Menus.closeRadial.bind(Menus);

  // HUD & Utilities
  static notify = Hud.notify.bind(Hud);
  static showTextUI = Hud.showTextUI.bind(Hud);
  static hideTextUI = Hud.hideTextUI.bind(Hud);
  static copyToClipboard = Hud.copyToClipboard.bind(Hud);
  static skillCheck = Hud.skillCheck.bind(Hud);
  static cancelSkillCheck = Hud.cancelSkillCheck.bind(Hud);
}
