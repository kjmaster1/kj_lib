import { Logger } from '../common/logger';
import { wait } from '../common/utils';

export class Streaming {
  /**
   * Load a model (ped, vehicle, object)
   * @param model The model name or hash
   * @param timeout Max time to wait in ms (default 10000)
   */
  static async loadModel(model: string | number, timeout = 10000): Promise<boolean> {
    const hash = typeof model === 'string' ? GetHashKey(model) : model;

    if (!IsModelInCdimage(hash)) {
      Logger.error(`Model ${model} does not exist in CD image.`);
      return false;
    }

    RequestModel(hash);

    const start = GetGameTimer();
    while (!HasModelLoaded(hash)) {
      if (GetGameTimer() - start > timeout) {
        Logger.error(`Timeout loading model: ${model}`);
        return false;
      }
      await wait(10);
    }
    return true;
  }

  /**
   * Load an animation dictionary
   */
  static async loadAnim(dict: string, timeout = 5000): Promise<boolean> {
    if (HasAnimDictLoaded(dict)) return true;

    RequestAnimDict(dict);

    const start = GetGameTimer();
    while (!HasAnimDictLoaded(dict)) {
      if (GetGameTimer() - start > timeout) {
        Logger.error(`Timeout loading anim dict: ${dict}`);
        return false;
      }
      await wait(10);
    }
    return true;
  }

  /**
   * Load a specific texture dictionary
   */
  static async loadTexture(dict: string, timeout = 5000): Promise<boolean> {
    if (HasStreamedTextureDictLoaded(dict)) return true;

    RequestStreamedTextureDict(dict, true);

    const start = GetGameTimer();
    while (!HasStreamedTextureDictLoaded(dict)) {
      if (GetGameTimer() - start > timeout) {
        Logger.error(`Timeout loading texture dict: ${dict}`);
        return false;
      }
      await wait(10);
    }
    return true;
  }

  static async loadPtfx(asset: string, timeout: number = 10000): Promise<boolean> {
    if (HasNamedPtfxAssetLoaded(asset)) return true;
    RequestNamedPtfxAsset(asset);

    const start = GetGameTimer();
    while (!HasNamedPtfxAssetLoaded(asset)) {
      if (GetGameTimer() - start > timeout) return false;
      await wait(0);
    }
    return true;
  }

  static async requestControl(entity: number, timeout: number = 2000): Promise<boolean> {
    if (!DoesEntityExist(entity)) return false;
    if (NetworkHasControlOfEntity(entity)) return true;

    NetworkRequestControlOfEntity(entity);

    const start = GetGameTimer();
    while (!NetworkHasControlOfEntity(entity)) {
      await wait(10);
      if (GetGameTimer() - start > timeout) return false;
    }
    return true;
  }
}
