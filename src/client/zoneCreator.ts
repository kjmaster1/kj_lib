import { Cache } from "./cache";
import {Interface} from "./interface";
import {Utils} from "../common/utils";

interface ZonePoint {
  x: number;
  y: number;
  z: number;
}

export class ZoneCreator {
  private static isCreating = false;
  private static points: ZonePoint[] = [];
  private static zoneName: string = 'my_zone';
  private static minZ: number = 0;
  private static maxZ: number = 0;
  private static tick: number | null = null;

  // Store current raycast result for the draw loop
  private static currentHit: number[] | null = null;

  static init() {
    RegisterCommand('createzone', async (source: number, args: string[]) => {
      const type = args[0] || 'poly';
      const name = args[1] || 'new_zone';

      if (type !== 'poly') {
        console.log('Only "poly" zones are supported in this version.');
        return;
      }

      if (this.isCreating) {
        this.stop();
      } else {
        this.start(name);
      }
    }, false);
  }

  private static start(name: string) {
    this.isCreating = true;
    this.zoneName = name;
    this.points = [];
    this.minZ = Cache.coords[2] - 2.0;
    this.maxZ = Cache.coords[2] + 5.0;

    Interface.showTextUI(`
      [E] Add Point  
      [Z] Undo Last Point  
      [Enter] Save Zone  
      [Scroll] Adjust Height
    `, { position: 'right-center', icon: 'draw-polygon' });

    this.startLoop();
  }

  private static stop() {
    this.isCreating = false;
    if (this.tick !== null) {
      clearTick(this.tick);
      this.tick = null;
    }
    Interface.hideTextUI();
    this.points = [];
    this.currentHit = null;
  }

  private static startLoop() {
    this.tick = setTick(() => {
      if (!this.isCreating) return;

      // 1. Raycast from Camera
      const hit = this.raycastFromCamera(20.0);

      // 2. Controls & Interaction
      if (hit && hit.hit) {
        this.currentHit = hit.coords;

        // Draw marker at look position
        DrawMarker(28, hit.coords[0], hit.coords[1], hit.coords[2], 0, 0, 0, 0, 0, 0, 0.1, 0.1, 0.1, 255, 0, 0, 150, false, false, 2, false, null, null, false);

        // [E] Add Point
        if (IsControlJustPressed(0, 38)) {
          this.points.push({ x: hit.coords[0], y: hit.coords[1], z: hit.coords[2] });
        }
      } else {
        this.currentHit = null;
      }

      // [Z] Undo
      if (IsControlJustPressed(0, 20)) {
        this.points.pop();
      }

      // [Enter] Save
      if (IsControlJustPressed(0, 18)) {
        this.save();
      }

      // [Scroll] Adjust Z
      if (IsControlPressed(0, 14)) { // Scroll Down
        if (IsControlPressed(0, 21)) this.maxZ -= 0.1; // Shift + Scroll for MaxZ
        else this.minZ -= 0.1;
      }
      if (IsControlPressed(0, 15)) { // Scroll Up
        if (IsControlPressed(0, 21)) this.maxZ += 0.1;
        else this.minZ += 0.1;
      }

      // 3. Visualization
      this.drawZone();
    });
  }

  private static drawZone() {
    const r = 255, g = 42, b = 24; // Reddish color

    // 1. Draw Existing Points
    for (let i = 0; i < this.points.length; i++) {
      const p1 = this.points[i];
      // Connect to next point, or loop back to start if it's the last point (and we aren't actively editing)
      const p2 = this.points[(i + 1) % this.points.length];

      // Don't draw the closing line yet if we are editing, we handle that with the cursor below
      if (i === this.points.length - 1) break;

      // Draw Walls
      DrawLine(p1.x, p1.y, this.minZ, p2.x, p2.y, this.minZ, r, g, b, 200); // Bottom
      DrawLine(p1.x, p1.y, this.maxZ, p2.x, p2.y, this.maxZ, r, g, b, 200); // Top
      DrawLine(p1.x, p1.y, this.minZ, p1.x, p1.y, this.maxZ, r, g, b, 200); // Pillar
    }

    // 2. Draw "Preview" Lines (Cursor to last point, Cursor to start point)
    if (this.currentHit && this.points.length > 0) {
      const lastPoint = this.points[this.points.length - 1];
      const startPoint = this.points[0];
      const cursor = { x: this.currentHit[0], y: this.currentHit[1] };

      // Draw Line from Last Point -> Cursor
      DrawLine(lastPoint.x, lastPoint.y, this.minZ, cursor.x, cursor.y, this.minZ, 0, 255, 0, 200);
      DrawLine(lastPoint.x, lastPoint.y, this.maxZ, cursor.x, cursor.y, this.maxZ, 0, 255, 0, 200);

      // Draw Line from Cursor -> Start Point (Closing the loop)
      DrawLine(cursor.x, cursor.y, this.minZ, startPoint.x, startPoint.y, this.minZ, 0, 255, 0, 150); // Dimmer
      DrawLine(cursor.x, cursor.y, this.maxZ, startPoint.x, startPoint.y, this.maxZ, 0, 255, 0, 150); // Dimmer

      // Draw Pillars at Cursor (Visual aid for Z bounds)
      DrawLine(cursor.x, cursor.y, this.minZ, cursor.x, cursor.y, this.maxZ, 0, 255, 0, 200);
    }

    // 3. Draw existing pillars for points already placed
    for (const p of this.points) {
      DrawLine(p.x, p.y, this.minZ, p.x, p.y, this.maxZ, r, g, b, 200);
    }
  }

  private static save() {
    if (this.points.length < 3) {
      console.log('^1[ZoneCreator] ^7You need at least 3 points to create a polygon.');
      return;
    }

    // Generate TS Code for console copy/paste
    const pointsStr = this.points.map(p => `  { x: ${Utils.round(p.x, 2)}, y: ${Utils.round(p.y, 2)} }`).join(',\n');

    const output = `
new PolyZone([
${pointsStr}
], { 
  minZ: ${Utils.round(this.minZ, 2)}, 
  maxZ: ${Utils.round(this.maxZ, 2)}, 
  name: '${this.zoneName}',
  debug: true 
});
`;
    console.log('^2[Zone Created]^7 Check F8 Console for code.');
    console.log(output);

    // Trigger Server Save
    emitNet('kj_lib:server:saveZone', {
      name: this.zoneName,
      type: 'poly',
      points: this.points,
      minZ: this.minZ,
      maxZ: this.maxZ
    });

    this.stop();
  }

  private static raycastFromCamera(distance: number) {
    const camRot = GetGameplayCamRot(2);
    const camCoords = GetGameplayCamCoord();

    const rotation = {
      x: (Math.PI / 180) * camRot[0],
      y: (Math.PI / 180) * camRot[1],
      z: (Math.PI / 180) * camRot[2]
    };

    const direction = {
      x: -Math.sin(rotation.z) * Math.abs(Math.cos(rotation.x)),
      y: Math.cos(rotation.z) * Math.abs(Math.cos(rotation.x)),
      z: Math.sin(rotation.x)
    };

    const destination = {
      x: camCoords[0] + direction.x * distance,
      y: camCoords[1] + direction.y * distance,
      z: camCoords[2] + direction.z * distance
    };

    const handle = StartShapeTestRay(
      camCoords[0], camCoords[1], camCoords[2],
      destination.x, destination.y, destination.z,
      -1, PlayerPedId(), 0
    );

    const [_, hit, endCoords, __, entityHit] = GetShapeTestResult(handle);

    return { hit: hit === 1, coords: endCoords, entity: entityHit };
  }
}
