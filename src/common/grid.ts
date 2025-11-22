export interface GridEntry {
  id: string;
  coords: number[]; // [x, y, z]
  // Dimensions usually derived from zone size or point radius
  dimension?: {
    width: number;  // X-axis spread
    length: number; // Y-axis spread
  };
  [key: string]: any;
}

export class Grid {
  private static mapMinX = -3700;
  private static mapMinY = -4400;
  private static mapMaxX = 4500;
  private static mapMaxY = 8000;

  // Calculate cell sizes (roughly 240x250 units)
  private static xDelta = (Grid.mapMaxX - Grid.mapMinX) / 34;
  private static yDelta = (Grid.mapMaxY - Grid.mapMinY) / 50;

  // The sparse grid: Row -> Column -> Array of Entries
  private static grid: Record<number, Record<number, GridEntry[]>> = {};

  // Cache for the last query to avoid re-calculating if player hasn't moved cells
  private static cache = {
    minX: -999,
    maxX: -999,
    minY: -999,
    maxY: -999,
    entries: [] as GridEntry[]
  };

  /**
   * Get grid cell indices for a specific coordinate
   */
  static getCellPosition(x: number, y: number): [number, number] {
    const cellX = Math.floor((x - this.mapMinX) / this.xDelta);
    const cellY = Math.floor((y - this.mapMinY) / this.yDelta);
    return [cellX, cellY];
  }

  /**
   * Calculate the range of cells an object covers based on its dimensions
   */
  private static getGridDimensions(x: number, y: number, width: number, length: number) {
    const minX = Math.floor((x - width - this.mapMinX) / this.xDelta);
    const maxX = Math.floor((x + width - this.mapMinX) / this.xDelta);
    const minY = Math.floor((y - length - this.mapMinY) / this.yDelta);
    const maxY = Math.floor((y + length - this.mapMinY) / this.yDelta);
    return { minX, maxX, minY, maxY };
  }

  /**
   * Add an entry to the grid
   */
  static add(entry: GridEntry) {
    const width = entry.dimension?.width || 2;
    const length = entry.dimension?.length || 2;

    const { minX, maxX, minY, maxY } = this.getGridDimensions(entry.coords[0], entry.coords[1], width, length);

    for (let y = minY; y <= maxY; y++) {
      if (!this.grid[y]) this.grid[y] = {};

      for (let x = minX; x <= maxX; x++) {
        if (!this.grid[y][x]) this.grid[y][x] = [];
        this.grid[y][x].push(entry);
      }
    }

    // Invalidate cache when grid changes
    this.cache.minX = -999;
  }

  /**
   * Remove an entry from the grid
   */
  static remove(entry: GridEntry) {
    const width = entry.dimension?.width || 2;
    const length = entry.dimension?.length || 2;

    const { minX, maxX, minY, maxY } = this.getGridDimensions(entry.coords[0], entry.coords[1], width, length);

    for (let y = minY; y <= maxY; y++) {
      if (!this.grid[y]) continue;

      for (let x = minX; x <= maxX; x++) {
        const cell = this.grid[y][x];
        if (!cell) continue;

        const idx = cell.findIndex(e => e.id === entry.id);
        if (idx !== -1) {
          cell.splice(idx, 1);
        }

        // Clean up empty cells
        if (cell.length === 0) delete this.grid[y][x];
      }

      // Clean up empty rows
      if (Object.keys(this.grid[y]).length === 0) delete this.grid[y];
    }

    this.cache.minX = -999;
  }

  /**
   * Get all entries in the cells surrounding the coordinate
   */
  static getNearby(coords: number[]): GridEntry[] {
    // We search a box size of 1 delta around the player
    // This ensures we check the current cell and immediate neighbors
    const { minX, maxX, minY, maxY } = this.getGridDimensions(coords[0], coords[1], this.xDelta, this.yDelta);

    // Return cached result if we are querying the exact same cell range
    if (
      this.cache.minX === minX &&
      this.cache.maxX === maxX &&
      this.cache.minY === minY &&
      this.cache.maxY === maxY
    ) {
      return this.cache.entries;
    }

    const nearby: GridEntry[] = [];
    const seen = new Set<string>(); // Deduplication

    for (let y = minY; y <= maxY; y++) {
      const row = this.grid[y];
      if (!row) continue;

      for (let x = minX; x <= maxX; x++) {
        const cell = row[x];
        if (!cell) continue;

        for (const entry of cell) {
          if (!seen.has(entry.id)) {
            seen.add(entry.id);
            nearby.push(entry);
          }
        }
      }
    }

    // Update Cache
    this.cache.minX = minX;
    this.cache.maxX = maxX;
    this.cache.minY = minY;
    this.cache.maxY = maxY;
    this.cache.entries = nearby;

    return nearby;
  }
}
