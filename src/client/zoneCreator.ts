// src/client/zoneCreator.ts
import {Cache} from './cache';
import {Interface} from './interface';
import {Logger, MathUtils, Vector3} from '../common';
import {Raycast, RaycastFlag} from './raycast';

export class ZoneCreator {
  private static active = false;
  private static points: Vector3[] = [];
  private static zoneName: string = 'poly_zone';

  private static minZ: number = 0;
  private static maxZ: number = 0;
  private static height: number = 6.0; // Default height diff

  private static tick: number | null = null;

  // Current cursor world position
  private static cursor: Vector3 | null = null;

  static init() {
    RegisterCommand('zone', (source: number, args: string[]) => {
      const action = args[0];
      const name = args[1] || 'new_zone';

      if (action === 'poly') {
        if (this.active) this.stop();
        else this.start(name);
      } else if (action === 'save') {
        this.save();
      } else if (action === 'cancel') {
        this.stop();
      } else {
        Logger.info('Usage: /zone [poly|save|cancel] [name]');
      }
    }, false);
  }

  private static start(name: string) {
    this.active = true;
    this.zoneName = name;
    this.points = [];

    // Initialize Z bounds based on player position
    const playerZ = Cache.get().coords.z;
    this.minZ = playerZ - 2.0;
    this.maxZ = playerZ + 4.0;
    this.height = this.maxZ - this.minZ;

    this.updateUI();
    this.startLoop();

    Logger.info(`[ZoneCreator] Started creating zone '${name}'`);
  }

  private static stop() {
    this.active = false;
    if (this.tick !== null) {
      clearTick(this.tick);
      this.tick = null;
    }
    Interface.hideTextUI();
    this.points = [];
    this.cursor = null;
    Logger.info('[ZoneCreator] Stopped');
  }

  private static updateUI() {
    Interface.showTextUI(`
      [E] Add Point (${this.points.length})
      [Z] Undo Last
      [Enter] Save
      [Scroll] Height: ${this.height.toFixed(1)}m
      [Shift+Scroll] Base Z: ${this.minZ.toFixed(1)}m
    `, {position: 'right-center', icon: 'vector-square'});
  }

  private static startLoop() {
    this.tick = setTick(async () => {
      if (!this.active) return;

      // 1. Raycast (Using shared library)
      // We use the synchronous result for immediate drawing
      const hit = await Raycast.fromCamera(20.0, RaycastFlag.Everything);

      if (hit.hit) {
        this.cursor = hit.endCoords;

        // Draw Cursor
        DrawMarker(28, this.cursor.x, this.cursor.y, this.cursor.z, 0, 0, 0, 0, 0, 0, 0.1, 0.1, 0.1, 255, 0, 0, 200, false, false, 2, false, null, null, false);

        // Input: Add Point
        if (IsControlJustPressed(0, 38)) { // E
          this.points.push({...this.cursor}); // Clone vector
          this.updateUI();
        }
      } else {
        this.cursor = null;
      }

      // Input: Undo
      if (IsControlJustPressed(0, 20)) { // Z
        this.points.pop();
        this.updateUI();
      }

      // Input: Save
      if (IsControlJustPressed(0, 18)) { // Enter
        this.save();
      }

      // Input: Adjust Height
      // Scroll Up (15) / Down (14)
      const scrollUp = IsControlPressed(0, 15);
      const scrollDown = IsControlPressed(0, 14);
      const shift = IsControlPressed(0, 21);

      if (scrollUp || scrollDown) {
        const dir = scrollUp ? 0.1 : -0.1;

        if (shift) {
          // Shift+Scroll: Move Base Z (minZ)
          this.minZ += dir;
          this.maxZ += dir; // Keep height constant
        } else {
          // Scroll: Change Height (maxZ)
          this.height += dir;
          // Clamp min height to 0.1
          if (this.height < 0.1) this.height = 0.1;
          this.maxZ = this.minZ + this.height;
        }
        this.updateUI();
      }

      // Visualization
      this.drawPoly();
    });
  }

  private static drawPoly() {
    const r = 0, g = 255, b = 100, a = 200;
    const count = this.points.length;

    // 1. Draw placed segments
    for (let i = 0; i < count; i++) {
      const p1 = this.points[i];
      // If not the last point, connect to next.
      // If last point, DO NOT loop back yet (we are editing).
      if (i < count - 1) {
        const p2 = this.points[i + 1];
        this.drawWall(p1, p2, r, g, b, a);
      }

      // Draw vertical pillar at vertex
      DrawLine(p1.x, p1.y, this.minZ, p1.x, p1.y, this.maxZ, r, g, b, a);
    }

    // 2. Draw preview lines (Last Point -> Cursor -> First Point)
    if (this.cursor && count > 0) {
      const last = this.points[count - 1];
      const first = this.points[0];

      // Active line (Red)
      this.drawWall(last, this.cursor, 255, 50, 50, 200);

      // Closing line (Yellow/Dim) - Shows what the final shape will be
      this.drawWall(this.cursor, first, 255, 200, 50, 100);
    }
  }

  private static drawWall(p1: Vector3, p2: Vector3, r: number, g: number, b: number, a: number) {
    DrawLine(p1.x, p1.y, this.minZ, p2.x, p2.y, this.minZ, r, g, b, a); // Bottom
    DrawLine(p1.x, p1.y, this.maxZ, p2.x, p2.y, this.maxZ, r, g, b, a); // Top
  }

  private static save() {
    if (this.points.length < 3) {
      Logger.error('Cannot save polyzone with fewer than 3 points.');
      return;
    }

    const pointsStr = this.points
      .map(p => `  { x: ${MathUtils.round(p.x, 2)}, y: ${MathUtils.round(p.y, 2)} }`)
      .join(',\n');

    const code = `
new PolyZone([
${pointsStr}
], {
  name: '${this.zoneName}',
  minZ: ${MathUtils.round(this.minZ, 2)},
  maxZ: ${MathUtils.round(this.maxZ, 2)},
  debug: true
});`;

    Logger.info('--- ZONE COPY START ---');
    console.log(code);
    Logger.info('--- ZONE COPY END ---');

    // Notify server (optional integration)
    emitNet('kj_lib:server:saveZone', {
      name: this.zoneName,
      points: this.points,
      minZ: this.minZ,
      maxZ: this.maxZ
    });

    this.stop();
  }
}
