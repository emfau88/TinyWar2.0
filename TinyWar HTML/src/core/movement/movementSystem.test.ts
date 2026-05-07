import { describe, expect, it } from "vitest";
import { createDebugLaneUnit, createDebugMidLaneUnit, createLaneUnit, updateMovingUnit } from "./movementSystem";

describe("movementSystem", () => {
  it("moves the debug unit along the mid lane", () => {
    const unit = createDebugMidLaneUnit();
    const moved = updateMovingUnit(unit, 1);

    expect(moved.position).not.toEqual(unit.position);
    expect(Math.hypot(moved.position.x - unit.position.x, moved.position.y - unit.position.y)).toBeGreaterThan(0);
  });

  it("moves 50 percent faster while using the original March strategy", () => {
    const unit = createDebugMidLaneUnit();
    const normal = updateMovingUnit(unit, 1 / 60, "Attack");
    const marching = updateMovingUnit(unit, 1 / 60, "March");
    const normalDistance = Math.hypot(normal.position.x - unit.position.x, normal.position.y - unit.position.y);
    const marchingDistance = Math.hypot(marching.position.x - unit.position.x, marching.position.y - unit.position.y);

    expect(marchingDistance).toBeCloseTo(normalDistance * 1.5, 5);
  });

  it("can create debug units for each lane", () => {
    expect(createDebugLaneUnit("Top").lane).toBe("Top");
    expect(createDebugLaneUnit("Mid").lane).toBe("Mid");
    expect(createDebugLaneUnit("Bot").lane).toBe("Bot");
  });

  it("can create lane units for queued basic unit names", () => {
    expect(createLaneUnit("Lancer", "Mid").name).toBe("Lancer");
    expect(createLaneUnit("Warrior", "Top").lane).toBe("Top");
  });

  it("creates red units on the right side moving right-to-left", () => {
    const red = createLaneUnit("Warrior", "Mid", 0, "enemy", "Red");

    expect(red.color).toBe("Red");
    expect(red.direction).toBe("RightToLeft");
    expect(red.position.x).toBeGreaterThan(1700);
  });

  it("advances pathIndex monotonically and does not jitter backwards", () => {
    let unit = createDebugMidLaneUnit();
    let maxPathIndex = unit.pathIndex;

    for (let frame = 0; frame < 500; frame += 1) {
      unit = updateMovingUnit(unit, 1 / 60);
      expect(unit.pathIndex).toBeGreaterThanOrEqual(maxPathIndex);
      maxPathIndex = Math.max(maxPathIndex, unit.pathIndex);
    }

    expect(unit.pathIndex).toBeGreaterThan(1);
  });

  it("eventually stops at the end of the lane", () => {
    let unit = createDebugMidLaneUnit();

    for (let frame = 0; frame < 5000 && unit.moving; frame += 1) {
      unit = updateMovingUnit(unit, 1 / 60);
    }

    expect(unit.moving).toBe(false);
    expect(unit.position.x).toBeGreaterThan(1700);
  });
});
