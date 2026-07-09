import { describe, expect, it } from "vitest";
import { createBuilding } from "../buildings/buildingData";
import { createUnit } from "../units/unitData";
import type { CombatUnit } from "../combat/combatSystem";
import {
  CLONE_MAX,
  INSTANT_ARMY_COUNT,
  SKULL_SWARM_COUNT,
  SPAWN_TURTLES_COUNT,
  SPIDER_SWARM_COUNT,
  applyConvertGoblins,
  applyConvertSharks,
  applyGnomesBasic,
  applyInstantHealing,
  applyLightning,
  applyRepair,
  bearDefenderRequests,
  cloneRequests,
  instantArmyRequests,
  isSpawningBoost,
  minotaurRageRequests,
  skullSwarmRequests,
  snakeSwarmRequests,
  spiderSwarmRequests,
  trollRequests,
  turtleRequests
} from "./instantBoosts";
import { UNITS } from "../units/unitData";

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
    expect(isSpawningBoost("Skulls")).toBe(true);
    expect(isSpawningBoost("Spiders")).toBe(true);
    expect(isSpawningBoost("SpawnTurtles")).toBe(true);
    expect(isSpawningBoost("MinotaurRage")).toBe(true);
    expect(isSpawningBoost("ConvertGoblins")).toBe(false);
    expect(isSpawningBoost("GnomesBasic")).toBe(false);
  });

  it("summons the port-scaled monster swarms for the color", () => {
    const skulls = skullSwarmRequests("Blue");
    expect(skulls).toHaveLength(SKULL_SWARM_COUNT);
    expect(skulls.every((r) => r.unit === "Skull" && r.color === "Blue")).toBe(true);

    const spiders = spiderSwarmRequests("Blue");
    expect(spiders).toHaveLength(SPIDER_SWARM_COUNT);
    expect(spiders.every((r) => r.unit === "Spider")).toBe(true);

    const turtles = turtleRequests("Blue");
    expect(turtles).toHaveLength(SPAWN_TURTLES_COUNT);
    expect(turtles.every((r) => r.unit === "Turtle")).toBe(true);
  });

  it("summons one minotaur per three enemy monsters, at least one", () => {
    const noMonsters = [unit("w", "Warrior", "Red", 100)];
    expect(minotaurRageRequests(noMonsters, "Blue")).toHaveLength(1);

    const sevenMonsters = [
      ...Array.from({ length: 7 }, (_, i) => unit(`s${i}`, "Skull", "Red", 60)),
      unit("own", "Goblin", "Blue", 100),
      unit("basic", "Warrior", "Red", 100)
    ];
    const requests = minotaurRageRequests(sevenMonsters, "Blue");
    expect(requests).toHaveLength(2);
    expect(requests.every((r) => r.unit === "Minotaur" && r.color === "Blue")).toBe(true);
  });

  it("converts all own lancers into goblins, keeping their current health", () => {
    const units = [
      { ...unit("l1", "Lancer", "Blue", 40), targetId: "x", targetKind: "unit" as const },
      unit("l2", "Lancer", "Red", 100),
      unit("w", "Warrior", "Blue", 100)
    ];
    const result = applyConvertGoblins(units, "Blue");

    expect(result.changedIds).toEqual(["l1"]);
    const goblin = result.units.find((u) => u.id === "l1")!;
    expect(goblin.name).toBe("Goblin");
    expect(goblin.health).toBe(40);
    expect(goblin.maxHealth).toBe(UNITS.Goblin.health);
    expect(goblin.targetId).toBeUndefined();
    expect(result.units.find((u) => u.id === "l2")!.name).toBe("Lancer");
    expect(result.units.find((u) => u.id === "w")!.name).toBe("Warrior");
  });

  it("converts only ground archers into sharks, sparing roof defenders", () => {
    const units = [
      unit("ground", "Archer", "Blue", 60),
      unit("roof", "Archer", "Blue", 60, "blue-base"),
      unit("enemy", "Archer", "Red", 60)
    ];
    const result = applyConvertSharks(units, "Blue");

    expect(result.changedIds).toEqual(["ground"]);
    expect(result.units.find((u) => u.id === "ground")!.name).toBe("Shark");
    expect(result.units.find((u) => u.id === "roof")!.name).toBe("Archer");
    expect(result.units.find((u) => u.id === "enemy")!.name).toBe("Archer");
  });

  it("curses enemy basic ground units into gnomes with proportional health", () => {
    const units = [
      unit("half", "Warrior", "Red", UNITS.Warrior.health / 2),
      unit("monster", "Bear", "Red", 200),
      unit("roof", "Archer", "Red", 60, "red-base"),
      unit("own", "Warrior", "Blue", 130)
    ];
    const result = applyGnomesBasic(units, "Blue");

    expect(result.changedIds).toEqual(["half"]);
    const gnome = result.units.find((u) => u.id === "half")!;
    expect(gnome.name).toBe("Gnome");
    expect(gnome.maxHealth).toBe(UNITS.Gnome.health);
    expect(gnome.health).toBeCloseTo(UNITS.Gnome.health / 2, 5);
    expect(result.units.find((u) => u.id === "monster")!.name).toBe("Bear");
    expect(result.units.find((u) => u.id === "own")!.name).toBe("Warrior");
  });
});
