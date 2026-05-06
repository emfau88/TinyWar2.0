import { describe, expect, it } from "vitest";
import { UNITS } from "./unitData";

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
});
