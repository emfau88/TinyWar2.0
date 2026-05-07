import { createBuilding, type BuildingInstance } from "../buildings/buildingData";
import { BUILDINGS } from "../buildings/buildingData";
import { startingPositions } from "../map/mapGeometry";
import { createUnit, type UnitInstance } from "../units/unitData";

const BASE_VISUAL_OFFSET_Y = 64;

export interface GameState {
  buildings: readonly BuildingInstance[];
  units: readonly UnitInstance[];
}

export function createInitialGameState(): GameState {
  const [leftStart, rightStart] = startingPositions();
  const leftBase = offsetBasePosition(leftStart);
  const rightBase = offsetBasePosition(rightStart);
  const buildings = [
    createBuilding("left-base", "Barracks", "Blue", true, leftBase),
    createBuilding("right-base", "Barracks", "Red", true, rightBase)
  ];

  return {
    buildings,
    units: createStartingBuildingArchers(buildings)
  };
}

function offsetBasePosition(position: { x: number; y: number }): { x: number; y: number } {
  return {
    x: position.x,
    y: position.y + BASE_VISUAL_OFFSET_Y
  };
}

function createStartingBuildingArchers(buildings: readonly BuildingInstance[]): UnitInstance[] {
  return buildings.flatMap((building) =>
    BUILDINGS[building.name].unitSlots.map((slot, index) =>
      createUnit(
        `${building.id}-archer-${index}`,
        "Archer",
        building.color,
        {
          x: building.position.x + slot.x,
          y: building.position.y + slot.y
        },
        building.id
      )
    )
  );
}
