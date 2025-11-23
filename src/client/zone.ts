// src/client/zone.ts
import {Grid, GridItem, Logger, MathUtils, Vector3} from '../common';
import {Cache} from './cache';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export type ZoneType = 'box' | 'sphere' | 'poly';

export interface ZoneOptions<T = any> {
  name?: string;
  debug?: boolean;
  data?: T; // Generic data
  onEnter?: (zone: Zone<T>) => void;
  onExit?: (zone: Zone<T>) => void;
  inside?: (zone: Zone<T>) => void;
}

// -----------------------------------------------------------------------------
// Zone Manager (Singleton)
// Handles the Grid and Ticker loop, separating logic from data.
// -----------------------------------------------------------------------------

class ZoneManager {
  private grid = new Grid<Zone<any>>();
  private activeZones = new Set<Zone<any>>();
  private insideZones = new Set<Zone<any>>();
  private tickHandle: number | null = null;

  public register(zone: Zone<any>) {
    this.grid.add(zone);
    this.activeZones.add(zone);
    this.ensureTicker();
  }

  public unregister(zone: Zone<any>) {
    this.grid.remove(zone);
    this.activeZones.delete(zone);

    // If we were inside, force an exit event
    if (this.insideZones.has(zone)) {
      this.insideZones.delete(zone);
      zone.isInside = false;
      zone.options.onExit?.(zone);
    }

    if (this.activeZones.size === 0 && this.tickHandle !== null) {
      clearTick(this.tickHandle);
      this.tickHandle = null;
      Logger.debug('[Zone] Ticker stopped (idle)');
    }
  }

  public updateGrid(zone: Zone<any>) {
    this.grid.update(zone);
  }

  private ensureTicker() {
    if (this.tickHandle !== null) return;
    Logger.debug('[Zone] Ticker started');

    this.tickHandle = setTick(() => {
      const playerCoords = Cache.get().coords;
      const nearby = this.grid.getNearby(playerCoords, 1);
      const frameInside = new Set<Zone<any>>();

      for (const zone of nearby) {
        if (zone.destroyed) continue;

        if (zone.contains(playerCoords)) {
          frameInside.add(zone);

          if (!zone.isInside) {
            zone.isInside = true;
            this.insideZones.add(zone);
            zone.options.onEnter?.(zone);
          }

          zone.options.inside?.(zone);
        }

        if (zone.options.debug) zone.debugDraw();
      }

      // Handle Exits
      for (const zone of this.insideZones) {
        if (!frameInside.has(zone)) {
          zone.isInside = false;
          this.insideZones.delete(zone);
          zone.options.onExit?.(zone);
        }
      }
    });
  }
}

export const ZoneSystem = new ZoneManager();

// -----------------------------------------------------------------------------
// Abstract Zone Class
// -----------------------------------------------------------------------------

export abstract class Zone<T = any> implements GridItem {
  public readonly id: string;
  public readonly coords: Vector3;
  public dimension: { width: number; length: number }; // Grid requirement
  public isInside: boolean = false;
  public destroyed: boolean = false;
  public readonly options: ZoneOptions<T>;
  public readonly data: T | undefined;

  protected constructor(coords: Vector3 | number[], options: ZoneOptions<T>) {
    this.id = options.name || `zone_${Math.random().toString(36).substring(2, 11)}`;
    this.options = options;
    this.data = options.data;

    this.coords = Array.isArray(coords)
      ? {x: coords[0], y: coords[1], z: coords[2]}
      : coords;

    // Default dimensions (must be overridden by subclasses before addToGrid)
    this.dimension = {width: 2, length: 2};
  }

  /**
   * Clean up the zone and remove from system.
   */
  public destroy() {
    if (this.destroyed) return;
    this.destroyed = true;
    ZoneSystem.unregister(this);
  }

  abstract contains(point: Vector3): boolean;

  abstract debugDraw(): void;

  /**
   * Subclasses call this after calculating their initial dimensions.
   */
  protected init() {
    ZoneSystem.register(this);
    if (this.options.debug) {
      Logger.debug(`[Zone] Created ${this.id}`);
    }
  }

  protected updateDimensions(width: number, length: number) {
    this.dimension = {width, length};
    if (!this.destroyed) ZoneSystem.updateGrid(this);
  }
}

// -----------------------------------------------------------------------------
// Concrete Implementations
// -----------------------------------------------------------------------------

export class SphereZone<T = any> extends Zone<T> {
  constructor(coords: Vector3 | number[], public radius: number, options: ZoneOptions<T> = {}) {
    super(coords, options);
    this.dimension = {width: radius, length: radius};
    this.init();
  }

  contains(point: Vector3): boolean {
    return MathUtils.distance(this.coords, point) <= this.radius;
  }

  debugDraw() {
    DrawMarker(28, this.coords.x, this.coords.y, this.coords.z, 0, 0, 0, 0, 0, 0, this.radius, this.radius, this.radius, 0, 255, 0, 30, false, false, 2, false, null, null, false);
  }
}

export class BoxZone<T = any> extends Zone<T> {
  public readonly size: Vector3;
  public readonly rotation: number;
  private readonly halfSize: Vector3;
  private readonly sinRot: number;
  private readonly cosRot: number;

  constructor(coords: Vector3 | number[], size: Vector3 | number[], rotation: number = 0, options: ZoneOptions<T> = {}) {
    super(coords, options);
    this.rotation = rotation;

    this.size = Array.isArray(size)
      ? {x: size[0], y: size[1], z: size[2]}
      : size;

    this.halfSize = {x: this.size.x / 2, y: this.size.y / 2, z: this.size.z / 2};

    // Pre-calc Trig
    const rad = -rotation * MathUtils.DEG2RAD;
    this.cosRot = Math.cos(rad);
    this.sinRot = Math.sin(rad);

    // Grid Dimension = Max horizontal extent
    const maxDim = Math.max(this.size.x, this.size.y);
    this.dimension = {width: maxDim, length: maxDim};

    this.init();
  }

  contains(point: Vector3): boolean {
    if (point.z < this.coords.z - this.halfSize.z || point.z > this.coords.z + this.halfSize.z) return false;

    const dx = point.x - this.coords.x;
    const dy = point.y - this.coords.y;
    const localX = (this.cosRot * dx) - (this.sinRot * dy);
    const localY = (this.sinRot * dx) + (this.cosRot * dy);

    return Math.abs(localX) <= this.halfSize.x && Math.abs(localY) <= this.halfSize.y;
  }

  debugDraw() {
    // Simple debug marker at center
    DrawMarker(0, this.coords.x, this.coords.y, this.coords.z + this.halfSize.z + 0.5, 0, 0, 0, 0, 0, this.rotation, 0.5, 0.5, 0.5, 255, 0, 0, 200, false, false, 2, false, null, null, false);
  }
}
