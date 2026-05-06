export interface TilePosition {
  x: number;
  y: number;
}

export interface WorldPosition {
  x: number;
  y: number;
}

export const MAP_TILE_SIZE = 64;
export const MAP_SIZE = {
  width: 30,
  height: 16
} as const;

export const STARTING_TILES = [
  { x: 3, y: 0 },
  { x: 27, y: 0 }
] as const satisfies readonly TilePosition[];

export function tileToWorld(tile: TilePosition): WorldPosition {
  return {
    x: MAP_TILE_SIZE * (tile.x + 0.5),
    y: MAP_TILE_SIZE * (tile.y + 0.5)
  };
}

export function startingPositions(): readonly WorldPosition[] {
  return STARTING_TILES.map(tileToWorld);
}
