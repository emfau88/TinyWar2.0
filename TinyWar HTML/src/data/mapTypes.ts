export interface TiledAnimationFrame {
  tileId: number;
  duration: number;
}

export interface TiledTilesetData {
  key: string;
  firstGid: number;
  name: string;
  tileWidth: number;
  tileHeight: number;
  tileCount: number;
  columns: number;
  image: string;
  imageWidth: number;
  imageHeight: number;
  animations: Record<string, readonly TiledAnimationFrame[]>;
}

export interface TiledLayerData {
  id: number;
  name: string;
  width: number;
  height: number;
  data: readonly number[];
  tileFlags: Record<number, TiledTileFlags>;
}

export interface TiledTileFlags {
  horizontal: boolean;
  vertical: boolean;
  diagonal: boolean;
  hexagonal120: boolean;
}

export interface TiledMapData {
  width: number;
  height: number;
  tileWidth: number;
  tileHeight: number;
  tilesets: readonly TiledTilesetData[];
  layers: readonly TiledLayerData[];
}
