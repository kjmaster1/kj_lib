import { wait } from '../common/utils';

export class Scaleform {
  private handle: number;

  private constructor(handle: number) {
    this.handle = handle;
  }

  static async request(movie: string): Promise<Scaleform | null> {
    const handle = RequestScaleformMovie(movie);
    const start = GetGameTimer();

    while (!HasScaleformMovieLoaded(handle)) {
      await wait(0);
      if (GetGameTimer() - start > 5000) {
        console.error(`[kj_lib] Failed to load scaleform: ${movie}`);
        return null;
      }
    }

    return new Scaleform(handle);
  }

  call(name: string, ...args: any[]) {
    BeginScaleformMovieMethod(this.handle, name);
    for (const arg of args) {
      if (typeof arg === 'number') {
        if (Number.isInteger(arg)) ScaleformMovieMethodAddParamInt(arg);
        else ScaleformMovieMethodAddParamFloat(arg);
      } else if (typeof arg === 'string') {
        ScaleformMovieMethodAddParamTextureNameString(arg);
      } else if (typeof arg === 'boolean') {
        ScaleformMovieMethodAddParamBool(arg);
      }
    }
    EndScaleformMovieMethod();
  }

  draw(x: number, y: number, width: number, height: number, r = 255, g = 255, b = 255, a = 255) {
    DrawScaleformMovie(this.handle, x, y, width, height, r, g, b, a, 0);
  }

  draw3D(coords: number[], rotation: number[], scale: number[]) {
    DrawScaleformMovie_3dNonAdditive(
      this.handle,
      coords[0], coords[1], coords[2],
      rotation[0], rotation[1], rotation[2],
      2, 2, 2, // p7, p8, p9 usually unused or rotation order
      scale[0], scale[1], scale[2],
      2 // p13
    );
  }

  dispose() {
    SetScaleformMovieAsNoLongerNeeded(this.handle);
  }
}
