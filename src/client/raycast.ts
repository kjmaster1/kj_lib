// src/client/raycast.ts
import {Logger, Vector3} from '../common';

/**
 * Common flags for StartShapeTest natives.
 * Combine with bitwise OR (|).
 */
export enum RaycastFlag {
  Map = 1,
  Vehicles = 2,
  Peds = 4,
  Objects = 16,
  Water = 32,
  Vegetation = 256,
  Everything = -1
}

export interface RaycastHit {
  /** Did the ray hit something? */
  hit: boolean;
  /** The exact coordinates where the ray hit */
  endCoords: Vector3;
  /** The surface normal vector of the hit */
  surfaceNormal: Vector3;
  /** The entity handle hit, or 0 if none */
  entity: number;
}

export class Raycast {
  private static readonly DEG2RAD = Math.PI / 180;

  /**
   * Cast a ray from the gameplay camera's center.
   * @param distance Max distance in units (meters)
   * @param flags Flags for what to intersect (default: Everything)
   * @param ignoreEntity Entity handle to ignore (default: PlayerPedId)
   */
  static async fromCamera(
    distance: number,
    flags: RaycastFlag | number = -1,
    ignoreEntity?: number
  ): Promise<RaycastHit> {
    const camRot = GetGameplayCamRot(2);
    const camCoords = GetGameplayCamCoord();

    // Math: Calculate forward vector from rotation
    const pitch = camRot[0] * this.DEG2RAD;
    const yaw = camRot[2] * this.DEG2RAD;

    const x = -Math.sin(yaw) * Math.abs(Math.cos(pitch));
    const y = Math.cos(yaw) * Math.abs(Math.cos(pitch));
    const z = Math.sin(pitch);

    const destX = camCoords[0] + (x * distance);
    const destY = camCoords[1] + (y * distance);
    const destZ = camCoords[2] + (z * distance);

    const handle = StartShapeTestLosProbe(
      camCoords[0], camCoords[1], camCoords[2],
      destX, destY, destZ,
      flags,
      ignoreEntity ?? PlayerPedId(),
      4 // Script type (4 = generic)
    );

    return this.resolveShapeTest(handle, 'CameraRaycast');
  }

  /**
   * Cast a ray between two specific points.
   */
  static async betweenCoords(
    start: Vector3 | number[],
    end: Vector3 | number[],
    flags: RaycastFlag | number = -1,
    ignoreEntity: number = 0
  ): Promise<RaycastHit> {
    // Normalize inputs to raw numbers
    const s = Array.isArray(start) ? start : [start.x, start.y, start.z];
    const e = Array.isArray(end) ? end : [end.x, end.y, end.z];

    const handle = StartShapeTestLosProbe(
      s[0], s[1], s[2],
      e[0], e[1], e[2],
      flags,
      ignoreEntity,
      4
    );

    return this.resolveShapeTest(handle, 'PointRaycast');
  }

  /**
   * Internal helper to poll the shape test result with a timeout safety.
   */
  private static resolveShapeTest(handle: number, debugName: string): Promise<RaycastHit> {
    return new Promise((resolve) => {
      const startTime = GetGameTimer();

      const tick = setTick(() => {
        // Timeout safety (2 seconds)
        if (GetGameTimer() - startTime > 2000) {
          clearTick(tick);
          Logger.warn(`${debugName} timed out`);
          resolve(this.emptyResult());
          return;
        }

        const result = GetShapeTestResult(handle);
        const state = result[0];

        // 1 = Pending (Wait), 0 = Failed?, 2 = Complete
        // Native reference varies, but generally "1" is the pending state for Async tests.
        if (state !== 1) {
          clearTick(tick);

          const hitBool = result[1] === 1 || result[1] === true;
          const endCoords = result[2] as number[];
          const surfaceNormal = result[3] as number[];
          const entityHit = result[4] as number;

          resolve({
            hit: hitBool,
            endCoords: {x: endCoords[0], y: endCoords[1], z: endCoords[2]},
            surfaceNormal: {x: surfaceNormal[0], y: surfaceNormal[1], z: surfaceNormal[2]},
            entity: entityHit
          });
        }
      });
    });
  }

  private static emptyResult(): RaycastHit {
    return {
      hit: false,
      endCoords: {x: 0, y: 0, z: 0},
      surfaceNormal: {x: 0, y: 0, z: 0},
      entity: 0
    };
  }
}
