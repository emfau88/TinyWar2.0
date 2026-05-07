import type { TiledTilesetData } from "../../data/mapTypes";

export interface TileVisualOffset {
  x: number;
  y: number;
}

const NO_OFFSET: TileVisualOffset = { x: 0, y: 0 };
const FOAM_OFFSET: TileVisualOffset = { x: -64, y: 60 };

export function visualOffsetForTileset(tileset: TiledTilesetData): TileVisualOffset {
  return tileset.name.toLowerCase() === "foam" ? FOAM_OFFSET : NO_OFFSET;
}
