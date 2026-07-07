import type { MapId } from "../core/map/mapDefinition";
import { MAP_DATA } from "./generated/mapData";
import { WILDNIS_MAP_DATA } from "./generated/wildnisMapData";
import type { TiledMapData } from "./mapTypes";

const MAP_DATA_BY_ID: Record<MapId, TiledMapData> = {
  classic: MAP_DATA,
  wildnis: WILDNIS_MAP_DATA
};

export function mapDataFor(id: MapId): TiledMapData {
  return MAP_DATA_BY_ID[id];
}

export function allMapData(): readonly TiledMapData[] {
  return Object.values(MAP_DATA_BY_ID);
}
