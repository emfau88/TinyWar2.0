import { beforeEach, describe, expect, it } from "vitest";
import { setActiveMap } from "../map/activeMap";
import { CLASSIC_MAP } from "../map/mapDefinition";
import { createLaneUnit, updateMovingUnit, type MovingUnit } from "../movement/movementSystem";
import { resolveCombat, type CombatState } from "./combatSystem";
import type { ProjectileInstance } from "./projectileSystem";

// Reproduces the GameScene loop: move units, then resolve combat, in 50ms
// ticks - the integration the unit-level combat tests do not cover.
function simulate(
  units: MovingUnit[],
  totalMs: number,
  stepMs = 50
): { units: MovingUnit[]; projectiles: ProjectileInstance[]; firedProjectiles: number } {
  let state: CombatState = { units, buildings: [], projectiles: [] };
  let firedProjectiles = 0;
  let previousProjectileCount = 0;

  for (let elapsed = 0; elapsed < totalMs; elapsed += stepMs) {
    const moved = (state.units as MovingUnit[]).map((unit) =>
      unit.moving ? updateMovingUnit(unit, stepMs / 1000) : unit
    );
    state = resolveCombat({ ...state, units: moved }, stepMs);
    const projectileCount = state.projectiles?.length ?? 0;
    if (projectileCount > previousProjectileCount) {
      firedProjectiles += projectileCount - previousProjectileCount;
    }
    previousProjectileCount = projectileCount;
  }

  return {
    units: [...(state.units as MovingUnit[])],
    projectiles: [...(state.projectiles ?? [])],
    firedProjectiles
  };
}

describe("monster combat integration (movement + combat loop)", () => {
  beforeEach(() => {
    setActiveMap(CLASSIC_MAP);
  });

  it("lets a minotaur walking the lane fight an oncoming warrior", () => {
    const minotaur = createLaneUnit("Minotaur", "Mid", 0, "blue", "Blue");
    const warrior = createLaneUnit("Warrior", "Mid", 0, "red", "Red");

    const result = simulate([minotaur, warrior], 60000);

    const warriorAfter = result.units.find((unit) => unit.color === "Red");
    // They must have met and fought: either the warrior died or took damage.
    expect(warriorAfter === undefined || warriorAfter.health < warrior.maxHealth).toBe(true);
  });

  it("lets a shark walking the lane fire harpoons at an oncoming warrior", () => {
    const shark = createLaneUnit("Shark", "Mid", 0, "blue", "Blue");
    const warrior = createLaneUnit("Warrior", "Mid", 0, "red", "Red");

    const result = simulate([shark, warrior], 60000);

    expect(result.firedProjectiles).toBeGreaterThan(0);
  });

  it("keeps a shark alive against a single warrior long enough to fight back", () => {
    const shark = createLaneUnit("Shark", "Mid", 0, "blue", "Blue");
    const warrior = createLaneUnit("Warrior", "Mid", 0, "red", "Red");

    // After 10 seconds they are still approaching or just met - the shark
    // must not be dead instantly.
    const early = simulate([shark, warrior], 10000);
    const sharkEarly = early.units.find((unit) => unit.color === "Blue");
    expect(sharkEarly).toBeDefined();
  });

  it("control: two basic warriors meet and fight", () => {
    const blue = createLaneUnit("Warrior", "Mid", 0, "blue", "Blue");
    const red = createLaneUnit("Warrior", "Mid", 0, "red", "Red");

    const result = simulate([blue, red], 60000);
    const anyDamaged = result.units.some((unit) => unit.health < unit.maxHealth);
    const anyDead = result.units.length < 2;
    expect(anyDamaged || anyDead).toBe(true);
  });
});
