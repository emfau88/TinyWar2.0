import { describe, expect, it } from "vitest";
import { createInitialGameState } from "./createInitialGameState";

describe("createInitialGameState", () => {
  it("starts solo with blue and red barracks visually offset below original starting positions", () => {
    const state = createInitialGameState();

    expect(state.buildings).toHaveLength(2);
    expect(state.buildings[0]).toMatchObject({
      id: "left-base",
      color: "Blue",
      name: "Barracks",
      position: { x: 224, y: 96 }
    });
    expect(state.buildings[1]).toMatchObject({
      id: "right-base",
      color: "Red",
      name: "Barracks",
      position: { x: 1760, y: 96 }
    });
  });

  it("starts with original on-building archers in barracks slots", () => {
    const state = createInitialGameState();

    expect(state.units).toHaveLength(4);
    expect(state.units[0]).toMatchObject({
      id: "left-base-archer-0",
      name: "Archer",
      color: "Blue",
      position: { x: 199, y: 116 },
      onBuildingId: "left-base"
    });
    expect(state.units[3]).toMatchObject({
      id: "right-base-archer-1",
      name: "Archer",
      color: "Red",
      position: { x: 1785, y: 116 },
      onBuildingId: "right-base"
    });
  });
});
