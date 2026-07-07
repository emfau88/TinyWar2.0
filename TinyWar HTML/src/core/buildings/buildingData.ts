export type BuildingName = "Barracks" | "Castle" | "Tower";
export type PlayerColor = "Black" | "Blue" | "Purple" | "Red" | "Yellow";

import { getActiveMap } from "../map/activeMap";
import { tileToWorld } from "../map/mapGeometry";
import type { BaseSetup } from "../map/mapDefinition";

export interface Size {
  width: number;
  height: number;
}

export interface UnitSlot {
  x: number;
  y: number;
}

export interface BuildingDefinition {
  name: BuildingName;
  size: Size;
  worldScale: number;
  health: number;
  unitSlots: readonly UnitSlot[];
}

export interface BuildingInstance {
  id: string;
  name: BuildingName;
  color: PlayerColor;
  isBase: boolean;
  health: number;
  maxHealth: number;
  position: {
    x: number;
    y: number;
  };
}

export interface WorldOffset {
  x: number;
  y: number;
}

export const BUILDING_SCALE = 0.7;
const BASE_RENDER_OFFSET_Y = 64;
const BASE_DEFENDER_HALF_TILE_OFFSET_X = 16;
const BASE_DEFENDER_HALF_TILE_OFFSET_Y = 32;

export const BUILDINGS: Record<BuildingName, BuildingDefinition> = {
  Barracks: {
    name: "Barracks",
    size: { width: 192, height: 256 },
    worldScale: BUILDING_SCALE,
    health: 1000,
    unitSlots: [
      { x: -25, y: 20 },
      { x: 25, y: 20 }
    ]
  },
  Castle: {
    name: "Castle",
    size: { width: 320, height: 256 },
    worldScale: BUILDING_SCALE,
    health: 2000,
    unitSlots: [
      { x: -70, y: 35 },
      { x: 0, y: 20 },
      { x: 70, y: 35 }
    ]
  },
  Tower: {
    name: "Tower",
    size: { width: 128, height: 256 },
    worldScale: BUILDING_SCALE,
    health: 500,
    unitSlots: [{ x: 0, y: 30 }]
  }
};

export function createBuilding(
  id: string,
  name: BuildingName,
  color: PlayerColor,
  isBase: boolean,
  position: { x: number; y: number }
): BuildingInstance {
  const definition = BUILDINGS[name];

  return {
    id,
    name,
    color,
    isBase,
    health: definition.health,
    maxHealth: definition.health,
    position
  };
}

export function getBuildingRenderOffset(building: BuildingInstance): WorldOffset {
  if (building.isBase && building.name === "Barracks") {
    return {
      x: 0,
      y: BASE_RENDER_OFFSET_Y
    };
  }

  return { x: 0, y: 0 };
}

export function getBuildingRenderPosition(building: BuildingInstance): WorldOffset {
  const offset = getBuildingRenderOffset(building);
  return {
    x: building.position.x + offset.x,
    y: building.position.y + offset.y
  };
}

export function getBuildingDoorSpawnPosition(building: BuildingInstance): WorldOffset {
  const base = baseSetupFor(building);
  if (base) {
    return tileToWorld(base.door);
  }

  return { ...building.position };
}

export function getBuildingCombatPosition(building: BuildingInstance): WorldOffset {
  return building.isBase ? getBuildingDoorSpawnPosition(building) : { ...building.position };
}

export function getBuildingUnitSlotPosition(
  building: BuildingInstance,
  slot: UnitSlot
): WorldOffset {
  const anchor = getBuildingRenderPosition(building);
  return {
    x: anchor.x + slot.x,
    y: anchor.y + slot.y
  };
}

export function getBuildingDefenderPositions(building: BuildingInstance): readonly WorldOffset[] {
  const base = baseSetupFor(building);
  if (base) {
    return base.roofDefenders.map((tile, index) => {
      const roofTile = tileToWorld(tile);
      const side = base.roofDefenders.length > 1 ? (index === 0 ? -1 : 1) : 0;
      return {
        x: roofTile.x + side * BASE_DEFENDER_HALF_TILE_OFFSET_X,
        y: roofTile.y - BASE_DEFENDER_HALF_TILE_OFFSET_Y
      };
    });
  }

  return BUILDINGS[building.name].unitSlots.map((slot) => getBuildingUnitSlotPosition(building, slot));
}

function baseSetupFor(building: BuildingInstance): BaseSetup | undefined {
  if (!building.isBase) {
    return undefined;
  }

  const { player, opponent } = getActiveMap().bases;
  for (const base of [player, opponent]) {
    const anchor = tileToWorld(base.anchor);
    if (
      base.building === building.name &&
      base.color === building.color &&
      building.position.x === anchor.x &&
      building.position.y === anchor.y
    ) {
      return base;
    }
  }

  return undefined;
}
