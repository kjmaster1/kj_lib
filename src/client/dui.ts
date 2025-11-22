import { Logger } from '../common/logger';

export interface DuiOptions {
  url: string;
  width: number;
  height: number;
  debug?: boolean;
}

export class Dui {
  private static instances: Map<string, Dui> = new Map();
  private static currentId = 0;
  private static resourceName = GetCurrentResourceName();
  private static initialized = false;

  public readonly id: string;
  private debug: boolean;

  public url: string;
  public duiObject: number;
  public duiHandle: string;
  public runtimeTxd: number;
  public txdObject: number;
  public dictName: string;
  public txtName: string;

  constructor(data: DuiOptions) {
    // Ensure the cleanup listener is registered once
    if (!Dui.initialized) {
      Dui.init();
    }

    const time = GetGameTimer();
    // Unique ID generation matching ox_lib style
    this.id = `${Dui.resourceName}_${time}_${Dui.currentId}`;
    Dui.currentId++;

    this.dictName = `kj_lib_dui_dict_${this.id}`;
    this.txtName = `kj_lib_dui_txt_${this.id}`;

    // 1. Create the Browser
    this.duiObject = CreateDui(data.url, data.width, data.height);
    this.duiHandle = GetDuiHandle(this.duiObject);

    // 2. Create the Runtime Texture container (TXD)
    this.runtimeTxd = CreateRuntimeTxd(this.dictName);

    // 3. Link the Browser handle to a Texture inside that TXD
    this.txdObject = CreateRuntimeTextureFromDuiHandle(this.runtimeTxd, this.txtName, this.duiHandle);

    this.debug = data.debug || false;
    this.url = data.url;

    // Track the instance
    Dui.instances.set(this.id, this);

    if (this.debug) {
      Logger.debug(`Dui ${this.id} created`);
    }
  }

  /**
   * Remove the DUI object and cleanup textures
   */
  remove() {
    // Navigate to blank before destroying to stop audio/scripts immediately
    SetDuiUrl(this.duiObject, 'about:blank');
    DestroyDui(this.duiObject);

    // Note: Runtime TXDs are usually cleaned up by the engine on resource stop,
    // but explicit cleanup of the DUI object is strictly required.

    Dui.instances.delete(this.id);

    if (this.debug) {
      Logger.debug(`Dui ${this.id} removed`);
    }
  }

  /**
   * Update the URL of the DUI
   */
  setUrl(url: string) {
    this.url = url;
    SetDuiUrl(this.duiObject, url);

    if (this.debug) {
      Logger.debug(`Dui ${this.id} url set to ${url}`);
    }
  }

  /**
   * Send a JSON message to the browser (window.addEventListener('message'))
   */
  sendMessage(message: object) {
    const jsonString = JSON.stringify(message);
    SendDuiMessage(this.duiObject, jsonString);

    if (this.debug) {
      Logger.debug(`Dui ${this.id} message sent:`, JSON.stringify(message, null, 2));
    }
  }

  /**
   * Inject mouse movement
   */
  sendMouseMove(x: number, y: number) {
    SendDuiMouseMove(this.duiObject, x, y);
  }

  /**
   * Inject mouse click down
   */
  sendMouseDown(button: 'left' | 'middle' | 'right') {
    SendDuiMouseDown(this.duiObject, button);
  }

  /**
   * Inject mouse click up
   */
  sendMouseUp(button: 'left' | 'middle' | 'right') {
    SendDuiMouseUp(this.duiObject, button);
  }

  /**
   * Inject scroll wheel
   */
  sendMouseWheel(deltaX: number, deltaY: number) {
    SendDuiMouseWheel(this.duiObject, deltaY, deltaX);
  }

  /**
   * Helper to return texture data for natives like DrawSprite
   */
  getTexture() {
    return { txd: this.dictName, txn: this.txtName };
  }

  /**
   * Static initialization to handle resource stopping
   */
  private static init() {
    Dui.initialized = true;

    on('onResourceStop', (resource: string) => {
      if (resource !== Dui.resourceName) return;

      Dui.instances.forEach((dui) => {
        try {
          dui.remove();
        } catch (e) {
          // Ignore errors during cleanup
        }
      });
      Dui.instances.clear();
    });
  }
}
