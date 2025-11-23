// src/client/point.ts
import {Grid, GridItem, Logger, MathUtils, Vector3} from '../common';
import {Cache} from './cache';

export interface PointOptions {
  /** Interaction radius in units */
  distance: number;
  /** Draw a debug marker? */
  debug?: boolean;
  /** Triggered once when entering the radius */
  onEnter?: (point: Point) => void;
  /** Triggered once when exiting the radius */
  onExit?: (point: Point) => void;
  /** Triggered every frame while inside the radius */
  nearby?: (point: Point) => void;
}

export class Point implements GridItem {
  private static grid = new Grid<Point>();
  private static activePoints = new Set<Point>();
  private static insidePoints = new Set<Point>();
  private static tickHandle: number | null = null;
  public readonly id: string;
  public readonly coords: Vector3;
  public readonly dimension: { width: number; length: number };
  private _destroyed: boolean = false;

  constructor(coords: Vector3 | number[], public options: PointOptions) {
    this.id = `pt_${Math.random().toString(36).substring(2, 11)}`;

    this.coords = Array.isArray(coords)
      ? {x: coords[0], y: coords[1], z: coords[2]}
      : coords;

    this.dimension = {
      width: options.distance,
      length: options.distance
    };

    // Register to dedicated grid
    Point.grid.add(this);
    Point.activePoints.add(this);

    Point.ensureTicker();

    if (options.debug) {
      Logger.debug(`[Point] Created at ${this.coords.x}, ${this.coords.y}`);
    }
  }

  private _isInside: boolean = false;

  public get isInside() {
    return this._isInside;
  }

  private static ensureTicker() {
    if (this.tickHandle !== null) return;

    Logger.debug('[Point] Ticker started');

    this.tickHandle = setTick(() => {
      const playerCoords = Cache.get().coords;
      const nearbyCandidates = Point.grid.getNearby(playerCoords);
      const currentFrameInside = new Set<Point>();

      for (const point of nearbyCandidates) {
        if (point._destroyed) continue;

        const dist = MathUtils.distance(playerCoords, point.coords);

        if (dist <= point.options.distance) {
          currentFrameInside.add(point);

          if (!point._isInside) {
            point._isInside = true;
            this.insidePoints.add(point);
            point.options.onEnter?.(point);
          }

          point.options.nearby?.(point);

          if (point.options.debug) {
            DrawMarker(28,
              point.coords.x, point.coords.y, point.coords.z,
              0, 0, 0, 0, 0, 0,
              point.options.distance, point.options.distance, point.options.distance,
              0, 255, 0, 30, false, false, 2, false, null, null, false
            );
          }
        }
      }

      for (const point of this.insidePoints) {
        if (!currentFrameInside.has(point)) {
          point._isInside = false;
          this.insidePoints.delete(point);
          point.options.onExit?.(point);
        }
      }
    });
  }

  public destroy() {
    if (this._destroyed) return;
    this._destroyed = true;

    if (this._isInside) {
      this._isInside = false;
      Point.insidePoints.delete(this);
      this.options.onExit?.(this);
    }

    Point.grid.remove(this);
    Point.activePoints.delete(this);

    if (Point.activePoints.size === 0 && Point.tickHandle !== null) {
      clearTick(Point.tickHandle);
      Point.tickHandle = null;
      Logger.debug('[Point] Ticker stopped (idle)');
    }
  }
}
