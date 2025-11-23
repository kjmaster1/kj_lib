// src/common/utils.ts
import {Resource} from './resource';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface Vector2 {
  x: number;
  y: number;
}

export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export type VectorInput = Vector3 | number[];

interface FetchResponse {
  ok: boolean;
  status: number;
  json: <T = any>() => Promise<T>;
}

// -----------------------------------------------------------------------------
// File I/O (Async Standardized)
// -----------------------------------------------------------------------------

/**
 * Loads a file from the current resource.
 * @param path Relative path to the file
 */
export function loadFile(path: string): string | null {
  if (Resource.isUI) {
    console.error('[Utils] loadFile cannot be called synchronously in NUI. Use fetch.');
    return null;
  }
  return LoadResourceFile(Resource.name, path);
}

/**
 * Loads a JSON file.
 * Note: In NUI, this MUST be awaited. In Game, it is technically sync but
 * typed as Promise for API consistency across environments.
 */
export async function loadJson<T = unknown>(path: string): Promise<T | null> {
  if (Resource.isUI) {
    try {
      const resp = await fetch(`/${path}`, {
        method: 'GET', // GET is standard for retrieving files
        headers: {'Content-Type': 'application/json'},
      }) as unknown as FetchResponse;
      if (!resp.ok) {
        console.error(`[Utils] JSON load failed: ${path} (Status: ${resp.status})`);
        return null;
      }
      return await resp.json();
    } catch (e) {
      console.error(`[Utils] Network error loading JSON: ${path}`, e);
      return null;
    }
  }

  const content = LoadResourceFile(Resource.name, path);
  if (!content) return null;

  try {
    return JSON.parse(content) as T;
  } catch (e) {
    console.error(`[Utils] Failed to parse JSON: ${path}`, e);
    return null;
  }
}

// -----------------------------------------------------------------------------
// Async Utilities
// -----------------------------------------------------------------------------

export const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Waits for a condition to be true.
 * @param conditionFn Function that returns a truthy value when ready.
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
        console.error('[Utils] Error in waitFor condition:', e);
        resolve(false); // Fail fast on error instead of timing out
        return;
      }

      if (Date.now() - start > timeoutMs) {
        resolve(false);
      } else {
        setTimeout(loop, tickRateMs);
      }
    };

    loop();
  });
};

// -----------------------------------------------------------------------------
// Math & Vectors
// -----------------------------------------------------------------------------

export const MathUtils = {
  DEG2RAD: Math.PI / 180.0,

  /**
   * Check if a value is null or undefined
   */
  isNil(val: unknown): val is null | undefined {
    return val === undefined || val === null;
  },

  /**
   * Calculate distance between two vectors.
   * Supports both Array [x,y,z] and Object {x,y,z} formats.
   */
  distance(v1: VectorInput, v2: VectorInput): number {
    const [x1, y1, z1] = Array.isArray(v1) ? v1 : [v1.x, v1.y, v1.z];
    const [x2, y2, z2] = Array.isArray(v2) ? v2 : [v2.x, v2.y, v2.z];

    const dx = x1 - x2;
    const dy = y1 - y2;
    const dz = z1 - z2;

    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  },

  /**
   * Rotate a point around a center (2D).
   * Useful for BoxZone calculations.
   */
  rotatePoint(center: Vector2, angle: number, point: Vector2): Vector2 {
    const rad = angle * MathUtils.DEG2RAD;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);

    const dx = point.x - center.x;
    const dy = point.y - center.y;

    return {
      x: (cos * dx) + (sin * dy) + center.x,
      y: (cos * dy) - (sin * dx) + center.y
    };
  },

  clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
  },

  lerp(start: number, end: number, amount: number): number {
    return (1 - amount) * start + amount * end;
  },

  round(value: number, decimals: number = 0): number {
    const multiplier = Math.pow(10, decimals);
    return Math.round(value * multiplier) / multiplier;
  },

  randomInt(min: number, max: number): number {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
};
