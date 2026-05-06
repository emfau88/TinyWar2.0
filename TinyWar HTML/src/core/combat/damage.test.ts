import { describe, expect, it } from "vitest";
import { calculateDamage, type DamageStats } from "./damage";

const emptyStats: DamageStats = {
  physicalDamage: 0,
  magicDamage: 0,
  armor: 0,
  magicResist: 0,
  armorPen: 0,
  magicPen: 0
};

describe("calculateDamage", () => {
  it("uses TinyWar's minimum damage of 5", () => {
    expect(calculateDamage(emptyStats, emptyStats)).toBe(5);
  });

  it("applies armor and magic resist mitigation after penetration", () => {
    const attacker: DamageStats = {
      ...emptyStats,
      physicalDamage: 15,
      magicDamage: 10,
      armorPen: 5,
      magicPen: 2
    };
    const defender: DamageStats = {
      ...emptyStats,
      armor: 10,
      magicResist: 7
    };

    expect(calculateDamage(attacker, defender)).toBeCloseTo(16.6667, 4);
  });
});
