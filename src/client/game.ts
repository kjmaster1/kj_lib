// src/client/game.ts
import {Cache} from './cache';
import {Vector3} from "../common";

export interface SearchOptions {
  coords?: Vector3;
  radius?: number;
  filter?: (entity: number) => boolean;
  ignore?: number[]; // Specific entities to exclude
}

export class Game {
  /**
   * Generic entity searcher to eliminate code duplication.
   * Uses Squared Distance comparison to avoid expensive Math.sqrt calls.
   */
  private static findClosestEntity(
    poolName: 'CVehicle' | 'CPed' | 'CObject',
    options: SearchOptions = {}
  ): number | null {
    // Default to Cache coords if none provided
    const origin = options.coords ?? Cache.get().coords;
    const radius = options.radius ?? 10;

    // Normalize vector input to simple x,y,z numbers for math
    const [ox, oy, oz] = Array.isArray(origin)
      ? origin
      : [origin.x, origin.y, origin.z];

    // Optimization: Compare against squared radius to avoid Math.sqrt() in loop
    const radiusSq = radius * radius;

    const entities = GetGamePool(poolName);

    let closestEntity: number | null = null;
    let minDistanceSq = radiusSq;

    for (const entity of entities) {
      // Skip ignored entities (e.g., player ped or specific vehicles)
      if (options.ignore && options.ignore.includes(entity)) continue;

      // Run custom filter if provided
      if (options.filter && !options.filter(entity)) continue;

      const [ex, ey, ez] = GetEntityCoords(entity, false);

      // Manual squared distance calculation
      const dx = ox - ex;
      const dy = oy - ey;
      const dz = oz - ez;
      const distanceSq = (dx * dx) + (dy * dy) + (dz * dz);

      if (distanceSq < minDistanceSq) {
        minDistanceSq = distanceSq;
        closestEntity = entity;
      }
    }

    return closestEntity;
  }

  /**
   * Get the closest vehicle to the player or specified coords
   */
  static getClosestVehicle(
    coords?: Vector3,
    radius: number = 10,
    includePlayerVehicle: boolean = false,
    filter?: (entity: number) => boolean
  ): number | null {
    const ignore: number[] = [];

    // Use Cache to safely get the current vehicle handle if we need to ignore it
    if (!includePlayerVehicle && Cache.get().vehicle) {
      ignore.push(Cache.get().vehicle);
    }

    return this.findClosestEntity('CVehicle', {
      coords,
      radius,
      filter,
      ignore
    });
  }

  /**
   * Get the closest ped to the player
   */
  static getClosestPed(
    coords?: Vector3,
    radius: number = 10,
    filter?: (entity: number) => boolean
  ): number | null {
    // Always ignore self when searching for peds
    const ignore = [Cache.get().ped];

    return this.findClosestEntity('CPed', {
      coords,
      radius,
      filter,
      ignore
    });
  }

  /**
   * Get the closest object to the player
   */
  static getClosestObject(
    coords?: Vector3,
    radius: number = 10,
    filter?: (entity: number) => boolean
  ): number | null {
    return this.findClosestEntity('CObject', {
      coords,
      radius,
      filter
    });
  }
}
