export interface RaycastHit {
  hit: boolean;
  coords: number[];
  surfaceNormal: number[];
  entity: number;
}

export class Raycast {
  static async calculateFromCamera(distance: number, flags: number = 30, ignore?: number) {
    const camRot = GetGameplayCamRot(2);
    const camCoords = GetGameplayCamCoord();

    // Convert Rotation to Direction Vector
    const adj = 0.0174532925199433;
    const x = -Math.sin(camRot[2] * adj) * Math.abs(Math.cos(camRot[0] * adj));
    const y = Math.cos(camRot[2] * adj) * Math.abs(Math.cos(camRot[0] * adj));
    const z = Math.sin(camRot[0] * adj);

    const destX = camCoords[0] + x * distance;
    const destY = camCoords[1] + y * distance;
    const destZ = camCoords[2] + z * distance;

    const rayHandle = StartShapeTestLosProbe(
      camCoords[0], camCoords[1], camCoords[2],
      destX, destY, destZ,
      flags,
      ignore || PlayerPedId(),
      4 // script type
    );

    return new Promise<RaycastHit>((resolve) => {
      const tick = setTick(() => {
        const result = GetShapeTestResult(rayHandle);
        if (result[0] !== 1) { // 1 = pending
          clearTick(tick);
          resolve({
            hit: result[1],
            coords: result[2],
            surfaceNormal: result[3],
            entity: result[4]
          });
        }
      });
    });
  }

  /**
   * Cast a ray between two points.
   */
  static async calculate(
    start: number[],
    destination: number[],
    flags: number = 30,
    ignore: number = 0
  ): Promise<RaycastHit> {
    const rayHandle = StartShapeTestLosProbe(
      start[0], start[1], start[2],
      destination[0], destination[1], destination[2],
      flags,
      ignore,
      4
    );

    return new Promise<RaycastHit>((resolve) => {
      const tick = setTick(() => {
        const result = GetShapeTestResult(rayHandle);
        if (result[0] !== 1) { // 1 = pending
          clearTick(tick);
          resolve({
            hit: result[1] === 1, // Lua returns 1 for hit, 0 for no hit
            coords: result[2],
            surfaceNormal: result[3],
            entity: result[4]
          });
        }
      });
    });
  }
}
