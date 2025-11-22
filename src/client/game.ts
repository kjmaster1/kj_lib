// src/client/game.ts
import { Utils } from '../common/utils';
import { Cache } from './cache';

export class Game {
  /**
   * Get the closest vehicle to the player or specified coords
   */
  static getClosestVehicle(coords?: number[], maxDistance: number = 10, includePlayerVehicle: boolean = false): number | null {
    const pCoords = coords || Cache.coords;
    const vehicles = GetGamePool('CVehicle');
    let closestVeh: number | null = null;
    let closestDist = maxDistance;

    const playerVeh = Cache.vehicle;

    for (const vehicle of vehicles) {
      if (!includePlayerVehicle && playerVeh === vehicle) continue;

      const vCoords = GetEntityCoords(vehicle, false);
      const dist = Utils.distance([pCoords[0], pCoords[1], pCoords[2]], [vCoords[0], vCoords[1], vCoords[2]]);

      if (dist < closestDist) {
        closestDist = dist;
        closestVeh = vehicle;
      }
    }

    return closestVeh;
  }

  /**
   * Get the closest ped to the player
   */
  static getClosestPed(coords?: number[], maxDistance: number = 10): number | null {
    const pCoords = coords || Cache.coords;
    const peds = GetGamePool('CPed');
    let closestPed: number | null = null;
    let closestDist = maxDistance;
    const playerPed = Cache.ped;

    for (const ped of peds) {
      if (ped === playerPed) continue; // Skip self

      const pedCoords = GetEntityCoords(ped, false);
      const dist = Utils.distance([pCoords[0], pCoords[1], pCoords[2]], [pedCoords[0], pedCoords[1], pedCoords[2]]);

      if (dist < closestDist) {
        closestDist = dist;
        closestPed = ped;
      }
    }

    return closestPed;
  }

  /**
   * Get the closest object to the player
   */
  static getClosestObject(coords?: number[], maxDistance: number = 10): number | null {
    const pCoords = coords || Cache.coords;
    const objects = GetGamePool('CObject');
    let closestObj: number | null = null;
    let closestDist = maxDistance;

    for (const obj of objects) {
      const oCoords = GetEntityCoords(obj, false);
      const dist = Utils.distance([pCoords[0], pCoords[1], pCoords[2]], [oCoords[0], oCoords[1], oCoords[2]]);

      if (dist < closestDist) {
        closestDist = dist;
        closestObj = obj;
      }
    }

    return closestObj;
  }
}
