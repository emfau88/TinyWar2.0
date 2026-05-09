import { describe, expect, it } from "vitest";
import { createInitialGameState } from "./createInitialGameState";

describe("createInitialGameState", () => {
  it("starts solo with blue and red barracks at clean original core positions", () => {
    const state = createInitialGameState();

    expect(state.buildings).toHaveLength(2);
    expect(state.buildings[0]).toMatchObject({
      id: "left-base",
      color: "Blue",
      name: "Barracks",
      position: { x: 224, y: 32 }
    });
    expect(state.buildings[1]).toMatchObject({
      id: "right-base",
      color: "Red",
      name: "Barracks",
      position: { x: 1760, y: 32 }
    });
  });

  it("starts with on-building archers positioned from building slot anchors", () => {
    const state = createInitialGameState();

    expect(state.units).toHaveLength(4);
    expect(state.units[0]).toMatchObject({
      id: "left-base-archer-0",
      name: "Archer",
      color: "Blue",
      position: { x: 208, y: 64 },
      onBuildingId: "left-base"
    });
    expect(state.units[3]).toMatchObject({
      id: "right-base-archer-1",
      name: "Archer",
      color: "Red",
      position: { x: 1776, y: 64 },
      onBuildingId: "right-base"
    });
  });
});
