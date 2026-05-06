import { createBuilding, type BuildingInstance } from "../buildings/buildingData";
import { BUILDINGS } from "../buildings/buildingData";
import { startingPositions } from "../map/mapGeometry";
import { createUnit, type UnitInstance } from "../units/unitData";

export interface GameState {
  buildings: readonly BuildingInstance[];
  units: readonly UnitInstance[];
}

export function createInitialGameState(): GameState {
  const [leftBase, rightBase] = startingPositions();
  const buildings = [
    createBuilding("left-base", "Barracks", "Blue", true, leftBase),
    createBuilding("right-base", "Barracks", "Red", true, rightBase)
  ];

  return {
    buildings,
    units: createStartingBuildingArchers(buildings)
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
