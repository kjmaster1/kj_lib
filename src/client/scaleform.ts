// src/client/scaleform.ts
import {Logger, Vector3, wait} from '../common';

export type ScaleformArg = string | number | boolean;

export interface Scaleform3DOptions {
  coords: Vector3;
  rotation?: Vector3;
  scale?: Vector3;
  /** * Rotation order for X, Y, Z axes. 2 is standard.
   * Default: { x: 2, y: 2, z: 2 }
   */
  rotOrder?: Vector3;
  /** * Often related to depth testing or sharpness.
   * Default: 2
   */
  unknownParam?: number;
}

export class Scaleform {
  public readonly id: string;

  private constructor(handle: number, movie: string) {
    this._handle = handle;
    this.id = movie;
  }

  private _handle: number | null;

  public get handle(): number {
    if (!this._handle) throw new Error(`[Scaleform] Attempted to access disposed handle: ${this.id}`);
    return this._handle;
  }

  public get isValid(): boolean {
    return this._handle !== null && HasScaleformMovieLoaded(this._handle);
  }

  /**
   * Request and load a Scaleform movie.
   * @param movie The name of the GFx file (e.g., "instructional_buttons")
   * @param timeout Max time to wait in ms (default: 5000)
   */
  static async request(movie: string, timeout: number = 5000): Promise<Scaleform | null> {
    const handle = RequestScaleformMovie(movie);
    const startTime = GetGameTimer();

    while (!HasScaleformMovieLoaded(handle)) {
      await wait(0);
      if (GetGameTimer() - startTime > timeout) {
        Logger.error(`[Scaleform] Timeout loading movie: ${movie}`);
        // Cleanup the pending request
        SetScaleformMovieAsNoLongerNeeded(handle);
        return null;
      }
    }

    return new Scaleform(handle, movie);
  }

  /**
   * Call a function inside the Scaleform movie.
   * @param name ActionScript function name
   * @param args Arguments to pass
   */
  public call(name: string, ...args: ScaleformArg[]) {
    if (!this.isValid) return;

    BeginScaleformMovieMethod(this.handle, name);

    for (const arg of args) {
      switch (typeof arg) {
        case 'number':
          if (Number.isInteger(arg)) {
            ScaleformMovieMethodAddParamInt(arg);
          } else {
            ScaleformMovieMethodAddParamFloat(arg);
          }
          break;
        case 'string':
          ScaleformMovieMethodAddParamTextureNameString(arg);
          break;
        case 'boolean':
          ScaleformMovieMethodAddParamBool(arg);
          break;
        default:
          Logger.warn(`[Scaleform] Unsupported argument type: ${typeof arg}`);
      }
    }

    EndScaleformMovieMethod();
  }

  /**
   * Render the scaleform in 2D space (screen).
   */
  public draw(x: number, y: number, width: number, height: number, r = 255, g = 255, b = 255, a = 255) {
    if (!this.isValid) return;
    DrawScaleformMovie(this.handle, x, y, width, height, r, g, b, a, 0);
  }

  /**
   * Render the scaleform in 3D world space.
   */
  public draw3D(options: Scaleform3DOptions) {
    if (!this.isValid) return;

    const {coords} = options;
    const rot = options.rotation ?? {x: 0, y: 0, z: 0};
    const scale = options.scale ?? {x: 1, y: 1, z: 1};
    const rotOrder = options.rotOrder ?? {x: 2, y: 2, z: 2};
    const unk = options.unknownParam ?? 2;

    DrawScaleformMovie_3dNonAdditive(
      this.handle,
      coords.x, coords.y, coords.z,
      rot.x, rot.y, rot.z,
      rotOrder.x, rotOrder.y, rotOrder.z,
      scale.x, scale.y, scale.z,
      unk
    );
  }

  /**
   * Render the scaleform as a fullscreen overlay (e.g. MP_BIG_MESSAGE_FREEMODE).
   */
  public drawFullscreen(r = 255, g = 255, b = 255, a = 255) {
    if (!this.isValid) return;
    DrawScaleformMovieFullscreen(this.handle, r, g, b, a, 0);
  }

  /**
   * Cleanup the scaleform handle.
   */
  public dispose() {
    if (this._handle !== null) {
      SetScaleformMovieAsNoLongerNeeded(this._handle);
      this._handle = null;
    }
  }
}
