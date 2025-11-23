// src/client/streaming.ts
import {Logger, waitFor} from '../common';

export class Streaming {
  /**
   * Load a model (ped, vehicle, object).
   */
  static async loadModel(model: string | number, timeout = 10000): Promise<boolean> {
    const hash = typeof model === 'string' ? GetHashKey(model) : model;

    if (!IsModelInCdimage(hash)) {
      Logger.error(`[Streaming] Model ${model} does not exist in CD image.`);
      return false;
    }

    return this.stream(
      model.toString(),
      () => RequestModel(hash),
      () => HasModelLoaded(hash),
      timeout
    );
  }

  /**
   * Load multiple models in parallel.
   * Useful for setting up scenes with many different props/peds.
   */
  static async loadModels(models: (string | number)[], timeout = 10000): Promise<boolean> {
    const results = await Promise.all(models.map(m => this.loadModel(m, timeout)));
    return results.every(success => success);
  }

  /**
   * Load an animation dictionary.
   */
  static async loadAnim(dict: string, timeout = 5000): Promise<boolean> {
    return this.stream(
      dict,
      () => RequestAnimDict(dict),
      () => HasAnimDictLoaded(dict),
      timeout
    );
  }

  /**
   * Load a specific texture dictionary.
   */
  static async loadTexture(dict: string, timeout = 5000): Promise<boolean> {
    return this.stream(
      dict,
      () => RequestStreamedTextureDict(dict, true),
      () => HasStreamedTextureDictLoaded(dict),
      timeout
    );
  }

  /**
   * Load a Named Particle Effect (Ptfx) asset.
   */
  static async loadPtfx(asset: string, timeout = 10000): Promise<boolean> {
    return this.stream(
      asset,
      () => RequestNamedPtfxAsset(asset),
      () => HasNamedPtfxAssetLoaded(asset),
      timeout
    );
  }

  /**
   * Load an animation set (clip set), usually for walking styles.
   */
  static async loadAnimSet(set: string, timeout = 5000): Promise<boolean> {
    return this.stream(
      set,
      () => RequestAnimSet(set),
      () => HasAnimSetLoaded(set),
      timeout
    );
  }

  /**
   * Load a weapon asset.
   * @param weapon Weapon name or hash
   * @param multiplier Resource multiplier (default 31)
   * @param flags Resource flags (default 0)
   */
  static async loadWeaponAsset(
    weapon: string | number,
    timeout = 5000,
    multiplier = 31,
    flags = 0
  ): Promise<boolean> {
    const hash = typeof weapon === 'string' ? GetHashKey(weapon) : weapon;

    return this.stream(
      weapon.toString(),
      () => RequestWeaponAsset(hash, multiplier, flags),
      () => HasWeaponAssetLoaded(hash),
      timeout
    );
  }

  /**
   * Request network control of an entity.
   */
  static async requestControl(entity: number, timeout = 2000): Promise<boolean> {
    if (!DoesEntityExist(entity)) return false;

    return this.stream(
      `Entity(${entity})`,
      () => NetworkRequestControlOfEntity(entity),
      () => NetworkHasControlOfEntity(entity),
      timeout
    );
  }

  /**
   * Generic helper to handle the request -> wait -> check lifecycle for any asset.
   * This standardizes timeout handling and logging across the entire library.
   */
  private static async stream(
    identifier: string,
    requestFn: () => void,
    checkFn: () => boolean,
    timeout: number
  ): Promise<boolean> {
    // 1. Check if already loaded (Optimistic check)
    if (checkFn()) return true;

    // 2. Request the asset
    requestFn();

    // 3. Wait for load using the common Utils waiter
    const loaded = await waitFor(
      checkFn,
      timeout,
      10 // Check every 10ms
    );

    if (!loaded) {
      Logger.error(`[Streaming] Timeout loading asset: ${identifier}`);
      return false;
    }

    return true;
  }
}
