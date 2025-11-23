// src/client/polyzone.ts
import {Zone, ZoneOptions} from './zone';
import {Vector2, Vector3} from '../common';

export type PolyPoint = Vector2;

export interface PolyZoneOptions<T = any> extends ZoneOptions<T> {
  minZ?: number;
  maxZ?: number;
}

export class PolyZone<T = any> extends Zone<T> {
  public readonly points: Vector2[];
  public readonly minZ?: number;
  public readonly maxZ?: number;
  private readonly min: Vector2;
  private readonly max: Vector2;

  constructor(points: PolyPoint[], options: PolyZoneOptions<T> = {}) {
    if (points.length < 3) throw new Error('[PolyZone] Polygon must have at least 3 points');

    // 1. Calculate Bounds & Center
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    // Deep copy points to vector2
    const safePoints = points.map(p => {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
      return {x: p.x, y: p.y};
    });

    const width = maxX - minX;
    const length = maxY - minY;
    const center: Vector3 = {
      x: minX + (width / 2),
      y: minY + (length / 2),
      z: options.minZ ?? 0
    };

    // 2. Initialize Parent
    super(center, options);

    this.points = safePoints;
    this.minZ = options.minZ;
    this.maxZ = options.maxZ;
    this.min = {x: minX, y: minY};
    this.max = {x: maxX, y: maxY};

    // 3. Set Grid Dimensions & Register
    this.dimension = {width, length};
    this.init();
  }

  contains(point: Vector3): boolean {
    // Z-Check
    if (this.minZ !== undefined && point.z < this.minZ) return false;
    if (this.maxZ !== undefined && point.z > this.maxZ) return false;

    // AABB Check
    if (point.x < this.min.x || point.x > this.max.x || point.y < this.min.y || point.y > this.max.y) return false;

    // Ray Casting
    let inside = false;
    const {x, y} = point;
    const len = this.points.length;

    for (let i = 0, j = len - 1; i < len; j = i++) {
      const xi = this.points[i].x, yi = this.points[i].y;
      const xj = this.points[j].x, yj = this.points[j].y;

      const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }

    return inside;
  }

  debugDraw() {
    const z = this.minZ ?? this.coords.z;
    const roofZ = this.maxZ ?? (z + 5.0);
    const r = 255, g = 42, b = 24, a = 150;

    const len = this.points.length;
    for (let i = 0; i < len; i++) {
      const p1 = this.points[i];
      const p2 = this.points[(i + 1) % len];

      DrawLine(p1.x, p1.y, z, p2.x, p2.y, z, r, g, b, a);
      DrawLine(p1.x, p1.y, roofZ, p2.x, p2.y, roofZ, r, g, b, a);
      DrawLine(p1.x, p1.y, z, p1.x, p1.y, roofZ, r, g, b, a);
    }
  }
}
