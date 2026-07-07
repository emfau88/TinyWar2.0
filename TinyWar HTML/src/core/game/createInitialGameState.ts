import {
  createBuilding,
  getBuildingDefenderPositions,
  type BuildingInstance
} from "../buildings/buildingData";
import { getActiveMap } from "../map/activeMap";
import { tileToWorld } from "../map/mapGeometry";
import { createUnit, type UnitInstance } from "../units/unitData";

export interface GameState {
  buildings: readonly BuildingInstance[];
  units: readonly UnitInstance[];
}

export function createInitialGameState(): GameState {
  const { player, opponent } = getActiveMap().bases;
  const buildings = [
    createBuilding("left-base", player.building, player.color, true, tileToWorld(player.anchor)),
    createBuilding("right-base", opponent.building, opponent.color, true, tileToWorld(opponent.anchor))
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
