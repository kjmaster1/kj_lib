import { Utils } from '../common/utils';
import { Grid, GridEntry } from '../common/grid';
import { Cache } from './cache';

interface PointOptions {
  distance: number;
  onEnter?: () => void;
  onExit?: () => void;
  nearby?: () => void;
}

export class Point implements GridEntry {
  public id: string;
  public isInside: boolean = false;
  public dimension?: { width: number; length: number };

  private static tick: number | null = null;
  private static insidePoints: Set<Point> = new Set();

  constructor(public coords: number[], public options: PointOptions) {
    this.id = Math.random().toString(36).substr(2, 9);

    // Register to Grid using the interaction distance as the size
    this.dimension = {
      width: options.distance,
      length: options.distance
    };
    Grid.add(this);

    Point.startTicker();
  }

  public destroy() {
    Grid.remove(this);
  }

  static startTicker() {
    if (this.tick !== null) return;

    this.tick = setTick(() => {
      const pCoords = Cache.coords;

      // Fetch only nearby points from Grid
      const nearbyEntries = Grid.getNearby(pCoords);
      const currentlyInside: Set<Point> = new Set();

      for (const entry of nearbyEntries) {
        // Filter to ensure it is a Point (since Grid is shared with Zones)
        if (!(entry instanceof Point)) continue;

        const dist = Utils.distance(pCoords, entry.coords);

        if (dist <= entry.options.distance) {
          currentlyInside.add(entry);

          if (!entry.isInside) {
            entry.isInside = true;
            Point.insidePoints.add(entry);
            entry.options.onEnter?.();
          }
          entry.options.nearby?.();
        }
      }

      // Handle Exits
      for (const point of Point.insidePoints) {
        if (!currentlyInside.has(point)) {
          point.isInside = false;
          Point.insidePoints.delete(point);
          point.options.onExit?.();
        }
      }
    });
  }
}
