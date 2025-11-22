import { Utils } from '../common/utils';
import { Grid, GridEntry } from '../common/grid';
import { Cache } from './cache';

export type ZoneType = 'box' | 'sphere' | 'poly';

export interface ZoneOptions {
  name?: string;
  debug?: boolean;
  onEnter?: () => void;
  onExit?: () => void;
  inside?: () => void;
}

export abstract class Zone implements GridEntry {
  public id: string;
  public inside: boolean = false;
  public dimension?: { width: number; length: number };

  // We no longer need a static registry array for ticking
  // The Grid handles storage
  private static tick: number | null = null;
  // Keep track of zones currently entered to handle onExit if we teleport away
  private static insideZones: Set<Zone> = new Set();

  constructor(public coords: number[], public type: ZoneType, public options: ZoneOptions = {}) {
    this.id = options.name || Math.random().toString(36).substr(2, 9);

    // Start the static ticker if it's not running
    Zone.startTicker();
  }

  protected addToGrid(width: number, length: number) {
    this.dimension = { width, length };
    Grid.add(this);
  }

  public destroy() {
    Grid.remove(this);
  }

  // Abstract method that subclasses must implement
  abstract isPointInside(point: number[]): boolean;
  abstract debugDraw(): void;

  // Main logic loop
  static startTicker() {
    if (this.tick !== null) return;

    this.tick = setTick(() => {
      // Use Cached coords for performance
      const pCoords = Cache.coords;

      // 1. Get ONLY nearby zones from the Grid
      // This transforms O(N) to O(1) for most frames
      const nearbyZones = Grid.getNearby(pCoords) as Zone[];

      // Track which zones we are currently inside during this frame
      const currentlyInside: Set<Zone> = new Set();

      for (const zone of nearbyZones) {
        // Double check type safety just in case
        if (!(zone instanceof Zone)) continue;

        const isInside = zone.isPointInside(pCoords);

        if (isInside) {
          currentlyInside.add(zone);

          if (!zone.inside) {
            zone.inside = true;
            Zone.insideZones.add(zone);
            if (zone.options.onEnter) zone.options.onEnter();
          }

          if (zone.options.inside) {
            zone.options.inside();
          }
        }

        if (zone.options.debug) {
          zone.debugDraw();
        }
      }

      // 2. Handle Exits
      // We iterate the Set of zones we WERE inside to see if we are NO LONGER inside
      // This handles cases where we walk out, or teleport out of grid range
      for (const zone of Zone.insideZones) {
        if (!currentlyInside.has(zone)) {
          // We are no longer inside this zone
          zone.inside = false;
          Zone.insideZones.delete(zone);
          if (zone.options.onExit) zone.options.onExit();
        }
      }
    });
  }
}

export class BoxZone extends Zone {
  public size: number[];
  public rotation: number;

  constructor(coords: number[], size: number[], rotation: number = 0, options: ZoneOptions = {}) {
    super(coords, 'box', options);
    this.size = size; // [width, depth, height]
    this.rotation = rotation;

    // Register to Grid with actual dimensions
    // We use the max dimension to be safe
    const maxDim = Math.max(size[0], size[1]);
    this.addToGrid(maxDim, maxDim);
  }

  isPointInside(point: number[]): boolean {
    const minZ = this.coords[2] - this.size[2] / 2;
    const maxZ = this.coords[2] + this.size[2] / 2;
    if (point[2] < minZ || point[2] > maxZ) return false;

    const [rx, ry] = Utils.rotatePoint(this.coords[0], this.coords[1], -this.rotation, point[0], point[1]);

    const halfWidth = this.size[0] / 2;
    const halfDepth = this.size[1] / 2;

    return (
      rx >= this.coords[0] - halfWidth &&
      rx <= this.coords[0] + halfWidth &&
      ry >= this.coords[1] - halfDepth &&
      ry <= this.coords[1] + halfDepth
    );
  }

  debugDraw() {
    DrawBox(
      this.coords[0] - this.size[0]/2, this.coords[1] - this.size[1]/2, this.coords[2] - this.size[2]/2,
      this.coords[0] + this.size[0]/2, this.coords[1] + this.size[1]/2, this.coords[2] + this.size[2]/2,
      0, 255, 0, 100
    );
  }
}

export class SphereZone extends Zone {
  public radius: number;

  constructor(coords: number[], radius: number, options: ZoneOptions = {}) {
    super(coords, 'sphere', options);
    this.radius = radius;

    // Register to Grid (width/length is diameter)
    this.addToGrid(radius, radius);
  }

  isPointInside(point: number[]): boolean {
    return Utils.distance(this.coords, point) <= this.radius;
  }

  debugDraw() {
    DrawMarker(
      28, // Sphere type
      this.coords[0], this.coords[1], this.coords[2],
      0, 0, 0, 0, 0, 0,
      this.radius, this.radius, this.radius,
      0, 255, 0, 100,
      false, false, 2, false, null, null, false
    );
  }
}
