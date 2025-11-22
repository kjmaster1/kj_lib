import { Logger } from '../common/logger';

export type InputMapper = 'keyboard' | 'mouse' | 'pad_digitalbutton' | 'pad_analogbutton';

export interface KeybindProps {
  name: string;
  description: string;
  defaultMapper?: InputMapper;
  defaultKey: string;
  secondaryMapper?: InputMapper;
  secondaryKey?: string;
  disabled?: boolean;
  onPressed?: (self: Keybind) => void;
  onReleased?: (self: Keybind) => void;
}

export class Keybind {
  public name: string;
  public description: string;
  public defaultKey: string;
  public disabled: boolean;
  public isPressed: boolean = false;
  public hash: number;

  private onPressedCallback?: (self: Keybind) => void;
  private onReleasedCallback?: (self: Keybind) => void;

  constructor(props: KeybindProps) {
    this.name = props.name;
    this.description = props.description;
    this.defaultKey = props.defaultKey;
    this.disabled = props.disabled ?? false;
    this.onPressedCallback = props.onPressed;
    this.onReleasedCallback = props.onReleased;

    // Generate hash for instructional buttons (similar to joaat in ox_lib)
    this.hash = GetHashKey(`+${this.name}`) | 0x80000000;

    this.register(props);
  }

  private register(props: KeybindProps) {
    const commandName = props.name;

    // Register the +Command (Pressed)
    RegisterCommand(`+${commandName}`, () => {
      if (this.disabled || IsPauseMenuActive()) return;
      this.isPressed = true;
      if (this.onPressedCallback) this.onPressedCallback(this);
    }, false);

    // Register the -Command (Released)
    RegisterCommand(`-${commandName}`, () => {
      if (this.disabled || IsPauseMenuActive()) return;
      this.isPressed = false;
      if (this.onReleasedCallback) this.onReleasedCallback(this);
    }, false);

    // Register Key Mapping
    RegisterKeyMapping(
      `+${commandName}`,
      props.description,
      props.defaultMapper ?? 'keyboard',
      props.defaultKey
    );

    // Secondary Key Mapping (Parity with ox_lib)
    if (props.secondaryKey) {
      RegisterKeyMapping(
        `~!+${commandName}`, // ~! prevents overwriting the primary if it exists
        props.description,
        props.secondaryMapper ?? props.defaultMapper ?? 'keyboard',
        props.secondaryKey
      );
    }

    // Clean up chat suggestions after a short delay
    setTimeout(() => {
      emit('chat:removeSuggestion', `/+${commandName}`);
      emit('chat:removeSuggestion', `/-${commandName}`);
    }, 500);

    Logger.info(`Keybind registered: ${this.name} [${this.defaultKey}]`);
  }

  public disable(state: boolean) {
    this.disabled = state;
    // If disabled while pressed, force a release event to prevent stuck logic
    if (state && this.isPressed) {
      this.isPressed = false;
      if (this.onReleasedCallback) this.onReleasedCallback(this);
    }
  }

  /**
   * Returns the instructional button string for Scaleforms
   */
  public getCurrentKey(): string {
    return GetControlInstructionalButton(0, this.hash, true).substring(2);
  }
}
