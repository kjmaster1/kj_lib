import { Zone, ZoneOptions } from './zone';

// Helper for Vector2 arithmetic
type Point = { x: number; y: number };

export interface PolyZoneOptions extends ZoneOptions {
  minZ?: number;
  maxZ?: number;
}

export class PolyZone extends Zone {
  public points: Point[];
  public minZ?: number;
  public maxZ?: number;

  // Bounding box for quick rejection and grid registration
  private minX: number;
  private maxX: number;
  private minY: number;
  private maxY: number;

  constructor(points: Point[] | number[][], options: PolyZoneOptions = {}) {
    // 1. Normalize points
    const parsedPoints = points.map(p =>
      Array.isArray(p) ? { x: p[0], y: p[1] } : p
    );

    // 2. Calculate Bounding Box
    const xs = parsedPoints.map(p => p.x);
    const ys = parsedPoints.map(p => p.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);

    // 3. Calculate Center and Dimensions for the Grid
    const width = maxX - minX;
    const length = maxY - minY;
    const centerX = minX + (width / 2);
    const centerY = minY + (length / 2);
    const centerZ = options.minZ || 0; // Z isn't used for 2D grid cell selection

    // 4. Initialize Parent Zone
    super([centerX, centerY, centerZ], 'poly', options);

    this.points = parsedPoints;
    this.minX = minX;
    this.maxX = maxX;
    this.minY = minY;
    this.maxY = maxY;
    this.minZ = options.minZ;
    this.maxZ = options.maxZ;

    // 5. Register to Grid
    // This allows the static Zone ticker to only check this zone when nearby
    this.addToGrid(width, length);
  }

  /**
   * Check if a point is inside the polygon
   */
  isPointInside(point: number[]): boolean {
    // 1. Z-Bounds Check (Fastest)
    if (this.minZ !== undefined && point[2] < this.minZ) return false;
    if (this.maxZ !== undefined && point[2] > this.maxZ) return false;

    // 2. AABB Check (Fast)
    // Even though the Grid gets us close, we still check bounds to avoid expensive raycasting
    if (point[0] < this.minX || point[0] > this.maxX || point[1] < this.minY || point[1] > this.maxY) {
      return false;
    }

    // 3. Ray Casting Algorithm (Point in Polygon)
    let inside = false;
    const x = point[0], y = point[1];

    for (let i = 0, j = this.points.length - 1; i < this.points.length; j = i++) {
      const xi = this.points[i].x, yi = this.points[i].y;
      const xj = this.points[j].x, yj = this.points[j].y;

      const intersect = ((yi > y) !== (yj > y))
        && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }

    return inside;
  }

  /**
   * debugDraw is called automatically by the Zone ticker if options.debug is true
   */
  debugDraw() {
    const z = this.minZ ?? this.coords[2];
    const height = (this.maxZ ?? z + 5.0) - z;
    const r = 255, g = 42, b = 24;

    for (let i = 0; i < this.points.length; i++) {
      const p1 = this.points[i];
      const p2 = this.points[(i + 1) % this.points.length];

      // Draw Base Lines
      DrawLine(p1.x, p1.y, z, p2.x, p2.y, z, r, g, b, 255);
      // Draw Pillars
      DrawLine(p1.x, p1.y, z, p1.x, p1.y, z + height, r, g, b, 255);
      // Draw Top Lines
      DrawLine(p1.x, p1.y, z + height, p2.x, p2.y, z + height, r, g, b, 255);
    }
  }
}
