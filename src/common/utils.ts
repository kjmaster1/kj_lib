import { ResourceName, IsBrowser } from './resource';

export function LoadFile(path: string) {
  return LoadResourceFile(ResourceName, path);
}

export function LoadJsonFile<T = unknown>(path: string): T {
  if (!IsBrowser) return JSON.parse(LoadFile(path)) as T;

  const resp = fetch(`/${path}`, {
    method: 'post',
    headers: {
      'Content-Type': 'application/json; charset=UTF-8',
    },
  });

  // @ts-ignore
  return resp.then((response) => response.json()) as T;
}

export const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Waits for a condition to be true.
 * @param conditionFn Function that returns a value. If truthy, wait ends.
 * @param timeoutMs Max time to wait.
 * @param tickRateMs How often to check.
 */
export const waitFor = <T>(
  conditionFn: () => T | Promise<T>,
  timeoutMs: number = 1000,
  tickRateMs: number = 50
): Promise<T | false> => {
  return new Promise(async (resolve) => {
    const start = Date.now();

    const loop = async () => {
      try {
        const result = await conditionFn();
        if (result) {
          resolve(result);
          return;
        }
      } catch (e) {
        // ignore errors during check
      }

      if (Date.now() - start > timeoutMs) {
        resolve(false);
      } else {
        setTimeout(loop, tickRateMs);
      }
    };

    await loop();
  });
};

export const Utils = {
  // Check if a value is undefined or null
  isNil: (val: any) => val === undefined || val === null,

  // Calculate distance between two vectors
  distance: (v1: number[], v2: number[]) => {
    const dx = v1[0] - v2[0];
    const dy = v1[1] - v2[1];
    const dz = v1[2] - v2[2];
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  },

  // Rotate a point around a center (for BoxZones)
  rotatePoint: (centerX: number, centerY: number, angle: number, pointX: number, pointY: number) => {
    const radians = (angle * Math.PI) / 180.0;
    const cos = Math.cos(radians);
    const sin = Math.sin(radians);

    const nx = (cos * (pointX - centerX)) + (sin * (pointY - centerY)) + centerX;
    const ny = (cos * (pointY - centerY)) - (sin * (pointX - centerX)) + centerY;

    return [nx, ny];
  },

  /**
   * Clamps a number between a minimum and maximum value.
   */
  clamp: (value: number, min: number, max: number): number => {
    return Math.min(Math.max(value, min), max);
  },

  /**
   * Linearly interpolates between two numbers.
   */
  lerp: (start: number, end: number, amount: number): number => {
    return (1 - amount) * start + amount * end;
  },

  /**
   * Rounds a number to a specific number of decimal places.
   */
  round: (value: number, decimals: number = 0): number => {
    const multiplier = Math.pow(10, decimals);
    return Math.round(value * multiplier) / multiplier;
  },

  /**
   * Generates a random integer between min and max (inclusive).
   */
  randomInt: (min: number, max: number): number => {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
};
