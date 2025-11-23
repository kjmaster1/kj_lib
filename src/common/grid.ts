// src/common/grid.ts
import {Vector3} from "./utils";

export interface GridItem {
  id: string;
  coords: Vector3;
  dimension?: {
    width: number;  // Radius or Width
    length: number; // Radius or Length
  };
}

export class Grid<T extends GridItem> {
  // Configuration
  private readonly cellSize: number;

  // Storage: "x,y" -> Map<ItemId, Item>
  // We use a Map for the bucket content to make removal O(1) instead of O(N)
  private buckets: Map<string, Map<string, T>> = new Map();

  // Cache for queries
  private cacheVersion = 0;
  private lastQuery = {
    key: '',
    results: [] as T[],
    version: -1
  };

  /**
   * @param cellSize The size of each grid cell. Default 250.0 (matches approx chunk size)
   */
  constructor(cellSize: number = 250.0) {
    this.cellSize = cellSize;
  }

  /**
   * Generates a unique string key for a cell coordinate
   */
  private getKey(x: number, y: number): string {
    return `${Math.floor(x / this.cellSize)},${Math.floor(y / this.cellSize)}`;
  }

  /**
   * Calculates the range of cell keys an item occupies
   */
  private getCellKeys(item: T): string[] {
    const width = item.dimension?.width || 0;
    const length = item.dimension?.length || 0;

    // If item has no dimensions, it only exists in one cell
    if (width === 0 && length === 0) {
      return [this.getKey(item.coords.x, item.coords.y)];
    }

    const startX = Math.floor((item.coords.x - width) / this.cellSize);
    const endX = Math.floor((item.coords.x + width) / this.cellSize);
    const startY = Math.floor((item.coords.y - length) / this.cellSize);
    const endY = Math.floor((item.coords.y + length) / this.cellSize);

    const keys: string[] = [];
    for (let x = startX; x <= endX; x++) {
      for (let y = startY; y <= endY; y++) {
        keys.push(`${x},${y}`);
      }
    }
    return keys;
  }

  /**
   * Add an item to the grid
   */
  public add(item: T): void {
    const keys = this.getCellKeys(item);

    for (const key of keys) {
      if (!this.buckets.has(key)) {
        this.buckets.set(key, new Map());
      }
      this.buckets.get(key)!.set(item.id, item);
    }

    this.cacheVersion++;
  }

  /**
   * Remove an item from the grid
   */
  public remove(item: T): void {
    const keys = this.getCellKeys(item);

    for (const key of keys) {
      const bucket = this.buckets.get(key);
      if (bucket) {
        bucket.delete(item.id);
        // Cleanup empty buckets to save memory
        if (bucket.size === 0) {
          this.buckets.delete(key);
        }
      }
    }

    this.cacheVersion++;
  }

  /**
   * Update an item's position in the grid.
   * More efficient than manual remove + add.
   */
  public update(item: T): void {
    this.remove(item);
    this.add(item);
  }

  /**
   * Get all items in the cells surrounding the coordinates.
   * Includes the cell the point is in, plus immediate neighbors.
   */
  public getNearby(coords: Vector3 | number[], rangeMultiplier: number = 1): T[] {
    const x = Array.isArray(coords) ? coords[0] : coords.x;
    const y = Array.isArray(coords) ? coords[1] : coords.y;

    // Generate a cache key based on the central cell and version
    const centerKey = this.getKey(x, y);

    // Check Cache
    if (
      this.lastQuery.key === centerKey &&
      this.lastQuery.version === this.cacheVersion
    ) {
      return this.lastQuery.results;
    }

    const cellX = Math.floor(x / this.cellSize);
    const cellY = Math.floor(y / this.cellSize);

    const results = new Map<string, T>(); // Use Map to deduplicate items spanning multiple cells

    // Scan neighbor cells
    for (let cx = cellX - rangeMultiplier; cx <= cellX + rangeMultiplier; cx++) {
      for (let cy = cellY - rangeMultiplier; cy <= cellY + rangeMultiplier; cy++) {
        const key = `${cx},${cy}`;
        const bucket = this.buckets.get(key);

        if (bucket) {
          for (const item of bucket.values()) {
            results.set(item.id, item);
          }
        }
      }
    }

    const arrayResults = Array.from(results.values());

    // Update Cache
    this.lastQuery = {
      key: centerKey,
      results: arrayResults,
      version: this.cacheVersion
    };

    return arrayResults;
  }

  /**
   * Debug method to see grid stats
   */
  public getStats() {
    return {
      buckets: this.buckets.size,
      cacheVersion: this.cacheVersion,
      cellSize: this.cellSize
    };
  }
}
