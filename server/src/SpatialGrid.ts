import { Player, MapZone } from './types.js';
import { SERVER_CONFIG } from './config.js';

export class SpatialGrid {
  private cellSize: number;
  private grid: Map<string, Set<string>> = new Map();

  constructor(cellSize: number = 256) {
    this.cellSize = cellSize;
  }

  private getKey(cx: number, cy: number): string {
    return `${cx}:${cy}`;
  }

  private getCellCoords(x: number, y: number): [number, number] {
    return [Math.floor(x / this.cellSize), Math.floor(y / this.cellSize)];
  }

  public updatePlayerPosition(player: Player): void {
    // Clear previous occurrences
    for (const set of this.grid.values()) {
      set.delete(player.id);
    }

    const [cx, cy] = this.getCellCoords(player.x, player.y);
    const key = this.getKey(cx, cy);
    if (!this.grid.has(key)) {
      this.grid.set(key, new Set());
    }
    this.grid.get(key)!.add(player.id);
  }

  public removePlayer(playerId: string): void {
    for (const set of this.grid.values()) {
      set.delete(playerId);
    }
  }

  public static getDistance(x1: number, y1: number, x2: number, y2: number): number {
    const dx = x1 - x2;
    const dy = y1 - y2;
    return Math.sqrt(dx * dx + dy * dy);
  }

  public static isWithinRadius(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    radius: number = SERVER_CONFIG.PROXIMITY_RADIUS
  ): boolean {
    return this.getDistance(x1, y1, x2, y2) <= radius;
  }

  public static resolveZone(x: number, y: number, zones: MapZone[]): MapZone | null {
    for (const zone of zones) {
      if (
        x >= zone.x &&
        x <= zone.x + zone.width &&
        y >= zone.y &&
        y <= zone.y + zone.height
      ) {
        return zone;
      }
    }
    return null;
  }
}
