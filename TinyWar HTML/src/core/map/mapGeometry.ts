import { getActiveMap } from "./activeMap";

export interface TilePosition {
  x: number;
  y: number;
}

export interface WorldPosition {
  x: number;
  y: number;
}

export const MAP_TILE_SIZE = 64;

export function mapSize(): { width: number; height: number } {
  return getActiveMap().size;
}

export function tileToWorld(tile: TilePosition): WorldPosition {
  return {
    x: MAP_TILE_SIZE * (tile.x + 0.5),
    y: MAP_TILE_SIZE * (tile.y + 0.5)
  };
}

export function startingPositions(): readonly WorldPosition[] {
  const map = getActiveMap();
  return [tileToWorld(map.start), tileToWorld(map.end)];
}
