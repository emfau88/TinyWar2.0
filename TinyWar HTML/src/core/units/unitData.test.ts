import { describe, expect, it } from "vitest";
import { MONSTER_UNITS, UNITS, isMonsterUnit, unitCanGuard, unitCycleDurationMs } from "./unitData";

describe("UNITS", () => {
  it("matches original Warrior and Lancer stats", () => {
    expect(UNITS.Warrior).toMatchObject({
      spriteSize: 192,
      renderSize: 96,
      worldSize: 96,
      speed: 30,
      range: 1,
      health: 130,
      physicalDamage: 15,
      magicDamage: 0,
      armor: 5,
      magicResist: 3,
      armorPen: 5,
      magicPen: 0,
      spawnDurationMs: 2500
    });
    expect(UNITS.Lancer).toMatchObject({
      spriteSize: 320,
      renderSize: 160,
      worldSize: 96,
      speed: 35,
      range: 1,
      health: 100,
      physicalDamage: 15,
      magicDamage: 0,
      armor: 3,
      magicResist: 3,
      armorPen: 8,
      magicPen: 0,
      spawnDurationMs: 1800
    });
  });

  it("matches original Archer and Priest stats", () => {
    expect(UNITS.Archer).toMatchObject({
      renderSize: 96,
      speed: 25,
      range: 3,
      health: 60,
      physicalDamage: 10,
      armor: 1,
      magicResist: 0,
      armorPen: 2,
      spawnDurationMs: 3300
    });
    expect(UNITS.Priest).toMatchObject({
      renderSize: 96,
      speed: 25,
      range: 3,
      health: 40,
      physicalDamage: -30,
      armor: 0,
      magicResist: 12,
      spawnDurationMs: 3400
    });
  });

  it("registers all thirteen monsters as monster units", () => {
    expect(MONSTER_UNITS).toHaveLength(13);
    for (const name of MONSTER_UNITS) {
      expect(isMonsterUnit(name)).toBe(true);
    }
    expect(isMonsterUnit("Warrior")).toBe(false);
  });

  it("matches original stats for the ranged monsters", () => {
    expect(UNITS.Gnoll).toMatchObject({
      spriteSize: 192,
      worldSize: 96,
      speed: 25,
      range: 2.5,
      health: 110,
      physicalDamage: 12,
      magicDamage: 0,
      armor: 2,
      magicResist: 2,
      armorPen: 4,
      magicPen: 2,
      spawnDurationMs: 3300
    });
    expect(UNITS.Shaman).toMatchObject({
      speed: 30,
      range: 2.5,
      health: 70,
      physicalDamage: 0,
      magicDamage: 22,
      armor: 0,
      magicResist: 17,
      armorPen: 6,
      magicPen: 8,
      spawnDurationMs: 7000
    });
    expect(UNITS.Shark).toMatchObject({
      speed: 25,
      range: 3,
      health: 60,
      magicDamage: 10,
      armorPen: 5,
      magicPen: 5,
      spawnDurationMs: 3500
    });
  });

  it("matches original stats for the big and guard-capable monsters", () => {
    expect(UNITS.Minotaur).toMatchObject({
      spriteSize: 320,
      renderSize: 160,
      worldSize: 160,
      speed: 25,
      health: 200,
      magicDamage: 30,
      armor: 12,
      magicResist: 12,
      spawnDurationMs: 7900
    });
    expect(UNITS.Turtle).toMatchObject({
      spriteSize: 320,
      renderSize: 160,
      worldSize: 160,
      speed: 15,
      health: 350,
      physicalDamage: 5,
      magicDamage: 5,
      armor: 20,
      magicResist: 20,
      spawnDurationMs: 6500
    });
    // Goblin uses a bigger 256px sheet but keeps the default collision size.
    expect(UNITS.Goblin).toMatchObject({
      spriteSize: 256,
      renderSize: 128,
      worldSize: 96,
      armorPen: 12,
      spawnDurationMs: 2000
    });
  });

  it("only allows the original guard-capable units to guard", () => {
    const guardUnits = (Object.keys(UNITS) as (keyof typeof UNITS)[]).filter(unitCanGuard);
    expect(guardUnits.sort()).toEqual(["Minotaur", "Skull", "Turtle", "Warrior"]);
  });

  it("derives attack cycles from the original attack frame counts", () => {
    expect(unitCycleDurationMs("Gnoll")).toBe(600);
    expect(unitCycleDurationMs("Minotaur")).toBe(1200);
    expect(unitCycleDurationMs("Shark")).toBe(400);
    expect(unitCycleDurationMs("Turtle")).toBe(1000);
  });
});
