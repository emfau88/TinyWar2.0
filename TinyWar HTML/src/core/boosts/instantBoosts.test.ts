import { describe, expect, it } from "vitest";
import { createBuilding } from "../buildings/buildingData";
import { createUnit } from "../units/unitData";
import type { CombatUnit } from "../combat/combatSystem";
import {
  CLONE_MAX,
  INSTANT_ARMY_COUNT,
  applyInstantHealing,
  applyLightning,
  applyRepair,
  bearDefenderRequests,
  cloneRequests,
  instantArmyRequests,
  isSpawningBoost,
  snakeSwarmRequests,
  trollRequests
} from "./instantBoosts";

function unit(
  id: string,
  name: Parameters<typeof createUnit>[1],
  color: Parameters<typeof createUnit>[2],
  health: number,
  onBuildingId?: string
): CombatUnit {
  const base = createUnit(id, name, color, { x: 0, y: 0 }, onBuildingId);
  return { ...base, health, attackCooldownMs: 0, moving: true };
}

describe("instant boosts", () => {
  it("heals only the chosen color to full", () => {
    const units = [unit("a", "Warrior", "Blue", 10), unit("b", "Warrior", "Red", 10)];
    const healed = applyInstantHealing(units, "Blue");
    expect(healed.find((u) => u.id === "a")!.health).toBe(units[0].maxHealth);
    expect(healed.find((u) => u.id === "b")!.health).toBe(10);
  });

  it("repairs only the chosen color's buildings", () => {
    const blue = { ...createBuilding("bb", "Barracks", "Blue", true, { x: 0, y: 0 }), health: 100 };
    const red = { ...createBuilding("rb", "Barracks", "Red", true, { x: 0, y: 0 }), health: 100 };
    const repaired = applyRepair([blue, red], "Blue");
    expect(repaired.find((b) => b.id === "bb")!.health).toBe(blue.maxHealth);
    expect(repaired.find((b) => b.id === "rb")!.health).toBe(100);
  });

  it("halves all units' health, never below 1", () => {
    const units = [unit("a", "Warrior", "Blue", 130), unit("b", "Snake", "Red", 1)];
    const struck = applyLightning(units);
    expect(struck.find((u) => u.id === "a")!.health).toBe(65);
    expect(struck.find((u) => u.id === "b")!.health).toBe(1);
  });

  it("requests six army units for the color", () => {
    const reqs = instantArmyRequests("Blue", () => 0);
    expect(reqs).toHaveLength(INSTANT_ARMY_COUNT);
    expect(reqs.every((r) => r.color === "Blue")).toBe(true);
  });

  it("clones up to eight marching units, in place, skipping roof units", () => {
    const units = [
      ...Array.from({ length: 10 }, (_, i) => unit(`m${i}`, "Warrior", "Blue", 100)),
      unit("roof", "Archer", "Blue", 100, "blue-base")
    ];
    const reqs = cloneRequests(units, "Blue");
    expect(reqs).toHaveLength(CLONE_MAX);
    expect(reqs.every((r) => r.position !== undefined)).toBe(true);
  });

  it("summons a bear per priest, positioned beside it", () => {
    const units = [
      unit("p1", "Priest", "Blue", 40),
      unit("p2", "Priest", "Blue", 40),
      unit("w", "Warrior", "Blue", 100)
    ];
    const reqs = bearDefenderRequests(units, "Blue");
    expect(reqs).toHaveLength(2);
    expect(reqs.every((r) => r.unit === "Bear")).toBe(true);
  });

  it("summons snake swarms and troll packs for the color", () => {
    expect(snakeSwarmRequests("Red").every((r) => r.unit === "Snake" && r.color === "Red")).toBe(true);
    expect(trollRequests("Blue").every((r) => r.unit === "Troll")).toBe(true);
  });

  it("classifies spawning vs pure-transform instant boosts", () => {
    expect(isSpawningBoost("InstantArmy")).toBe(true);
    expect(isSpawningBoost("BearDefender")).toBe(true);
    expect(isSpawningBoost("Repair")).toBe(false);
    expect(isSpawningBoost("Lightning")).toBe(false);
  });
});
