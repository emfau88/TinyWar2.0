export type BuildingName = "Barracks" | "Castle" | "Tower";
export type PlayerColor = "Black" | "Blue" | "Purple" | "Red" | "Yellow";

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

export const BUILDING_SCALE = 0.7;

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
