import {
  createBuilding,
  getBuildingDefenderPositions,
  type BuildingInstance
} from "../buildings/buildingData";
import { startingPositions } from "../map/mapGeometry";
import { createUnit, type UnitInstance } from "../units/unitData";

export interface GameState {
  buildings: readonly BuildingInstance[];
  units: readonly UnitInstance[];
}

export function createInitialGameState(): GameState {
  const [leftStart, rightStart] = startingPositions();
  const buildings = [
    createBuilding("left-base", "Barracks", "Blue", true, leftStart),
    createBuilding("right-base", "Barracks", "Red", true, rightStart)
  ];

  return {
    buildings,
    units: createStartingBuildingArchers(buildings)
  };
}

function createStartingBuildingArchers(buildings: readonly BuildingInstance[]): UnitInstance[] {
  return buildings.flatMap((building) =>
    getBuildingDefenderPositions(building).map((position, index) => {
      return createUnit(
        `${building.id}-archer-${index}`,
        "Archer",
        building.color,
        position,
        building.id
      );
    })
  );
}
