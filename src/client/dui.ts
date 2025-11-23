// src/client/dui.ts
import {Logger} from '../common';

export interface DuiOptions {
  url: string;
  width: number;
  height: number;
  debug?: boolean;
}

export interface DuiTexture {
  dict: string;
  txt: string;
}

export class Dui {
  // Registry to track active instances for cleanup
  private static registry = new Set<Dui>();
  private static initialized = false;
  private static readonly RESOURCE_NAME = GetCurrentResourceName();

  // Unique ID counter
  private static uniqueIdCounter = 0;

  // Private backing fields (Encapsulation)
  private readonly _id: string;
  private readonly _debug: boolean;
  private _url: string;

  // Native Handles (Private to prevent external tampering)
  private _duiObject: number | null = null;
  private _duiHandle: string | null = null;
  private _runtimeTxd: number | null = null;

  // Texture identifiers
  private readonly _dictName: string;
  private readonly _txtName: string;

  // ---------------------------------------------------------------------------
  // Getters
  // ---------------------------------------------------------------------------

  public get id(): string {
    return this._id;
  }

  public get url(): string {
    return this._url;
  }

  public get dictName(): string {
    return this._dictName;
  }

  public get txtName(): string {
    return this._txtName;
  }

  public get isValid(): boolean {
    return this._duiObject !== null;
  }

  constructor(options: DuiOptions) {
    Dui.ensureLifecycleListener();

    // Generate unique identifier
    const timestamp = GetGameTimer();
    this._id = `${Dui.RESOURCE_NAME}_${timestamp}_${Dui.uniqueIdCounter++}`;

    this._url = options.url;
    this._debug = options.debug ?? false;

    // Define texture names
    this._dictName = `kj_lib_dict_${this._id}`;
    this._txtName = `kj_lib_txt_${this._id}`;

    try {
      this.initializeNativeDui(options.width, options.height);
      Dui.registry.add(this);

      if (this._debug) {
        Logger.debug(`[DUI] Created instance ${this._id} pointing to ${this._url}`);
      }
    } catch (error) {
      Logger.error(`[DUI] Failed to create Dui instance: ${error}`);
      this.destroy(); // Ensure partial cleanup if init fails
      throw error;
    }
  }

  // ---------------------------------------------------------------------------
  // Core Logic
  // ---------------------------------------------------------------------------

  private initializeNativeDui(width: number, height: number) {
    // 1. Create the Browser Object
    const duiObject = CreateDui(this._url, width, height);
    if (!duiObject) throw new Error('CreateDui native returned 0/false');

    this._duiObject = duiObject;
    this._duiHandle = GetDuiHandle(duiObject);

    // 2. Create Runtime Texture Dictionary (TXD)
    // Note: Creates a new TXD wrapper in memory
    this._runtimeTxd = CreateRuntimeTxd(this._dictName);
    if (!this._runtimeTxd) throw new Error('CreateRuntimeTxd failed');

    // 3. Bind the Dui Handle to a Texture inside the TXD
    // This effectively "paints" the browser onto a texture we can use in DrawSprite/DrawMarker
    CreateRuntimeTextureFromDuiHandle(this._runtimeTxd, this._txtName, this._duiHandle);
  }

  /**
   * Completely destroys the DUI instance, textures, and removes it from the registry.
   */
  public destroy() {
    if (!this.isValid) return; // Already destroyed

    // 1. Stop audio/rendering immediately
    if (this._duiObject) {
      SetDuiUrl(this._duiObject, 'about:blank');
      DestroyDui(this._duiObject);
      this._duiObject = null;
      this._duiHandle = null;
    }

    // 2. Clean up graphics memory (Important for repeated creation/destruction)
    // Note: There isn't a direct "DestroyRuntimeTxd", but forcing the texture data to clear helps.
    // FiveM engine handles the actual memory pool of the RuntimeTxd, but we ensure we drop references.
    this._runtimeTxd = null;

    // 3. Registry cleanup
    Dui.registry.delete(this);

    if (this._debug) {
      Logger.debug(`[DUI] Destroyed instance ${this._id}`);
    }
  }

  /**
   * Helper for FiveM natives requiring texture dict/name pairs (e.g., DrawSprite).
   */
  public getTexture(): DuiTexture | null {
    if (!this.isValid) return null;
    return {dict: this._dictName, txt: this._txtName};
  }

  public setUrl(newUrl: string) {
    if (!this.ensureValid()) return;

    this._url = newUrl;
    SetDuiUrl(this._duiObject!, newUrl);

    if (this._debug) Logger.debug(`[DUI] ${this._id} URL updated`);
  }

  public sendMessage(data: Record<string, any>) {
    if (!this.ensureValid()) return;

    const payload = JSON.stringify(data);
    SendDuiMessage(this._duiObject!, payload);

    if (this._debug) {
      Logger.debug(`[DUI] Message sent to ${this._id}`, payload);
    }
  }

  // ---------------------------------------------------------------------------
  // Input Injection
  // ---------------------------------------------------------------------------

  public sendMouseMove(x: number, y: number) {
    if (this.ensureValid()) SendDuiMouseMove(this._duiObject!, x, y);
  }

  public sendMouseDown(button: 'left' | 'middle' | 'right') {
    if (this.ensureValid()) SendDuiMouseDown(this._duiObject!, button);
  }

  public sendMouseUp(button: 'left' | 'middle' | 'right') {
    if (this.ensureValid()) SendDuiMouseUp(this._duiObject!, button);
  }

  public sendMouseScroll(deltaY: number, deltaX: number = 0) {
    if (this.ensureValid()) SendDuiMouseWheel(this._duiObject!, deltaY, deltaX);
  }

  // ---------------------------------------------------------------------------
  // Internal Helpers
  // ---------------------------------------------------------------------------

  private ensureValid(): boolean {
    if (!this.isValid) {
      Logger.error(`[DUI] Attempted to interact with destroyed DUI instance ${this._id}`);
      return false;
    }
    return true;
  }

  private static ensureLifecycleListener() {
    if (this.initialized) return;
    this.initialized = true;

    on('onResourceStop', (resource: string) => {
      if (resource !== this.RESOURCE_NAME) return;

      Logger.info(`[DUI] Cleaning up ${this.registry.size} active instances...`);

      // Create a copy to safely iterate while modifying the Set inside destroy()
      const activeInstances = Array.from(this.registry);

      for (const dui of activeInstances) {
        try {
          dui.destroy();
        } catch (err) {
          Logger.error(`[DUI] Error during cleanup of ${dui.id}: ${err}`);
        }
      }

      this.registry.clear();
    });
  }
}
