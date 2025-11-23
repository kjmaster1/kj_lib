// src/client/keybind.ts
import {Logger} from '../common';

export type InputMapper = 'keyboard' | 'mouse' | 'pad_digitalbutton' | 'pad_analogbutton';

export interface KeybindProps {
  name: string;
  description: string;
  defaultMapper?: InputMapper;
  defaultKey: string;
  secondaryMapper?: InputMapper;
  secondaryKey?: string;

  /** Allow the keybind to trigger while the pause menu is open? Default: false */
  allowInPauseMenu?: boolean;

  disabled?: boolean;
  onPressed?: (self: Keybind) => void;
  onReleased?: (self: Keybind) => void;
}

export class Keybind {
  // Encapsulated state
  private readonly _name: string;
  private readonly _description: string;
  private readonly _hash: number;
  // Config
  private readonly _allowInPauseMenu: boolean;

  constructor(props: KeybindProps) {
    this._name = props.name;
    this._description = props.description;
    this._disabled = props.disabled ?? false;
    this._allowInPauseMenu = props.allowInPauseMenu ?? false;

    this._onPressed = props.onPressed;
    this._onReleased = props.onReleased;

    // Calculate hash for instructional buttons (force signed 32-bit integer)
    this._hash = GetHashKey(`+${this._name}`) | 0x80000000;

    this.register(props);
  }

  private _disabled: boolean;

  public get disabled() {
    return this._disabled;
  }

  private _isPressed: boolean = false;

  public get isPressed() {
    return this._isPressed;
  }

  private _destroyed: boolean = false;

  public get destroyed(): boolean {
    return this._destroyed;
  }

  // Callbacks
  private _onPressed?: (self: Keybind) => void;

  public get onPressed(): (self: Keybind) => void {
    return this._onPressed;
  }

  private _onReleased?: (self: Keybind) => void;

  public get onReleased(): (self: Keybind) => void {
    return this._onReleased;
  }

  // Getters
  public get name() {
    return this._name;
  }

  public get description(): string {
    return this._description;
  }

  public get allowInPauseMenu(): boolean {
    return this._allowInPauseMenu;
  }

  /**
   * Returns the instruction hash formatted for Scaleforms (int32)
   */
  public get hash() {
    return this._hash;
  }

  /**
   * Enable or Disable the keybind.
   * If disabled while held down, triggers a release event to prevent stuck inputs.
   */
  public setDisabled(state: boolean) {
    this._disabled = state;
    if (state && this._isPressed) {
      this._isPressed = false;
      if (this._onReleased) this._onReleased(this);
    }
  }

  /**
   * "Destroys" the keybind instance.
   * Note: The actual command remains registered in FiveM (cannot be unregistered),
   * but this disconnects the logic so pressing the key does nothing.
   */
  public destroy() {
    this._destroyed = true;
    this._onPressed = undefined;
    this._onReleased = undefined;
  }

  /**
   * Returns the Scaleform instructional button string (e.g. "t_E")
   */
  public getInstructionalButton(): string {
    // Arg 1 (0) = Control Group
    // Arg 2 (hash) = The command hash
    // Arg 3 (true) = Return text string?
    const raw = GetControlInstructionalButton(0, this._hash, true);
    // Strip the "t_" prefix usually returned by this native for keyboard keys
    return raw.replace(/^t_/, '');
  }

  private register(props: KeybindProps) {
    const commandName = this._name;

    // 1. Register the Primary Command (+name)
    RegisterCommand(`+${commandName}`, this.handlePress.bind(this), false);
    RegisterCommand(`-${commandName}`, this.handleRelease.bind(this), false);

    // 2. Register Primary Key Mapping
    RegisterKeyMapping(
      `+${commandName}`,
      props.description,
      props.defaultMapper ?? 'keyboard',
      props.defaultKey
    );

    // 3. Register Secondary Key Mapping (Proxy Command)
    // We register a distinct command that simply calls the primary logic.
    // This ensures both keys work reliably as defaults.
    if (props.secondaryKey) {
      RegisterKeyMapping(
        `~!+${commandName}`, // ~! prevents overwriting the primary if it exists
        props.description,
        props.secondaryMapper ?? props.defaultMapper ?? 'keyboard',
        props.secondaryKey
      );
    }

    // 4. Cleanup Chat Suggestions
    this.cleanupSuggestion(`+${commandName}`);
    this.cleanupSuggestion(`-${commandName}`);

    Logger.debug(`Keybind registered: ${this._name} [${props.defaultKey}]`);
  }

  private handlePress() {
    if (this._destroyed || this._disabled) return;
    if (!this._allowInPauseMenu && IsPauseMenuActive()) return;

    this._isPressed = true;
    if (this._onPressed) this._onPressed(this);
  }

  private handleRelease() {
    if (this._destroyed) return;
    // We generally allow release events even if disabled/paused to reset state,
    // but strict checking prevents logic firing in unwanted states.

    // Only fire release if we were actually pressed
    if (this._isPressed) {
      this._isPressed = false;
      if (this._onReleased) this._onReleased(this);
    }
  }

  private cleanupSuggestion(cmd: string) {
    // Use setTick to ensure this runs after the command registration tick
    const tick = setTick(() => {
      emit('chat:removeSuggestion', `/${cmd}`);
      clearTick(tick);
    });
  }
}
