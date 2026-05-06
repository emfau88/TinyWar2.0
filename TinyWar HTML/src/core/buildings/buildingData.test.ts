import { describe, expect, it } from "vitest";
import { BUILDINGS, createBuilding } from "./buildingData";

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
});
