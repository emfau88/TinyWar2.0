import { describe, expect, it } from "vitest";
import {
  bonusArmorPen,
  damageMultiplier,
  damageTakenMultiplier,
  rangeMultiplier,
  speedMultiplier
} from "./boostModifiers";
import type { ActiveBoost } from "./boostState";

const active = (...names: string[]): ActiveBoost[] =>
  names.map((name) => ({ name: name as ActiveBoost["name"], remainingMs: 10000 }));

describe("boostModifiers", () => {
  it("buffs the matching attacker type only", () => {
    expect(damageMultiplier(active("Warrior"), "Warrior")).toBe(1.5);
    expect(damageMultiplier(active("Warrior"), "Lancer")).toBe(1);
    expect(damageMultiplier(active("Lancer"), "Lancer")).toBeCloseTo(1.6);
    expect(damageMultiplier(active("Arrows"), "Archer")).toBeCloseTo(1.3);
  });

  it("returns neutral multipliers when no boosts are active", () => {
    expect(damageMultiplier(undefined, "Warrior")).toBe(1);
    expect(damageTakenMultiplier(undefined)).toBe(1);
    expect(speedMultiplier(undefined)).toBe(1);
    expect(rangeMultiplier(undefined, "Archer")).toBe(1);
    expect(bonusArmorPen(undefined)).toBe(0);
  });

  it("reduces incoming damage with ArmorGain", () => {
    expect(damageTakenMultiplier(active("ArmorGain"))).toBe(0.7);
  });

  it("doubles speed with Run", () => {
    expect(speedMultiplier(active("Run"))).toBe(2);
  });

  it("extends only archer range with Longbow", () => {
    expect(rangeMultiplier(active("Longbow"), "Archer")).toBe(1.5);
    expect(rangeMultiplier(active("Longbow"), "Warrior")).toBe(1);
  });

  it("grants armor penetration with Penetration", () => {
    expect(bonusArmorPen(active("Penetration"))).toBe(5);
  });

  it("stacks distinct buffs multiplicatively", () => {
    // Warrior outgoing 1.5, defender ArmorGain 0.7 -> 1.05 combined scale
    expect(damageMultiplier(active("Warrior"), "Warrior") * damageTakenMultiplier(active("ArmorGain"))).toBeCloseTo(1.05);
  });
});
