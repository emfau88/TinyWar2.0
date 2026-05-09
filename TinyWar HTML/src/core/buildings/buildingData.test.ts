import { describe, expect, it } from "vitest";
import {
  BUILDINGS,
  createBuilding,
  getBuildingDefenderPositions,
  getBuildingDoorSpawnPosition,
  getBuildingRenderPosition
} from "./buildingData";

describe("BUILDINGS", () => {
  it("matches original TinyWar building health", () => {
    expect(BUILDINGS.Barracks.health).toBe(1000);
    expect(BUILDINGS.Castle.health).toBe(2000);
    expect(BUILDINGS.Tower.health).toBe(500);
  });

  it("matches original unit slot counts", () => {
    expect(BUILDINGS.Barracks.unitSlots).toHaveLength(2);
    expect(BUILDINGS.Castle.unitSlots).toHaveLength(3);
    expect(BUILDINGS.Tower.unitSlots).toHaveLength(1);
  });

  it("creates a full-health base instance", () => {
    const building = createBuilding("left-base", "Barracks", "Blue", true, { x: 224, y: 32 });

    expect(building.health).toBe(1000);
    expect(building.maxHealth).toBe(1000);
    expect(building.isBase).toBe(true);
  });

  it("keeps a base core position separate from render offset", () => {
    const building = createBuilding("left-base", "Barracks", "Blue", true, { x: 224, y: 32 });

    expect(building.position).toEqual({ x: 224, y: 32 });
    expect(getBuildingRenderPosition(building)).toEqual({ x: 224, y: 96 });
  });

  it("defines door spawn anchors for left and right HQs", () => {
    const left = createBuilding("left-base", "Barracks", "Blue", true, { x: 224, y: 32 });
    const right = createBuilding("right-base", "Barracks", "Red", true, { x: 1760, y: 32 });

    expect(getBuildingDoorSpawnPosition(left)).toEqual({ x: 224, y: 160 });
    expect(getBuildingDoorSpawnPosition(right)).toEqual({ x: 1760, y: 160 });
  });

  it("defines two defender positions on the roof tile halves for each HQ", () => {
    const left = createBuilding("left-base", "Barracks", "Blue", true, { x: 224, y: 32 });
    const right = createBuilding("right-base", "Barracks", "Red", true, { x: 1760, y: 32 });

    expect(getBuildingDefenderPositions(left)).toEqual([
      { x: 208, y: 64 },
      { x: 240, y: 64 }
    ]);
    expect(getBuildingDefenderPositions(right)).toEqual([
      { x: 1744, y: 64 },
      { x: 1776, y: 64 }
    ]);
  });
});
