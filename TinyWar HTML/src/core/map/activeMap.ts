import { CLASSIC_MAP, assertValidMapDefinition, type MapDefinition } from "./mapDefinition";

let activeMap: MapDefinition = CLASSIC_MAP;

export function setActiveMap(map: MapDefinition): void {
  assertValidMapDefinition(map);
  activeMap = map;
}

export function getActiveMap(): MapDefinition {
  return activeMap;
}
