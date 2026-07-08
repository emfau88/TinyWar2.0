import { describe, expect, it } from "vitest";
import { createBuilding } from "../buildings/buildingData";
import { createUnit } from "../units/unitData";
import {
  ATTACK_DURATION_MS,
  BUILDING_DEFENDER_CYCLE_MULTIPLIER,
  ORIGINAL_RADIUS,
  resolveCombat,
  type CombatUnit
} from "./combatSystem";

function combatUnit(unit: ReturnType<typeof createUnit>): CombatUnit {
  return {
    ...unit,
    attackCooldownMs: 0,
    moving: true
  };
}

describe("resolveCombat", () => {
  it("starts an attack cycle before applying melee damage", () => {
    const blue = combatUnit(createUnit("blue-warrior", "Warrior", "Blue", { x: 100, y: 100 }));
    const red = combatUnit(createUnit("red-lancer", "Lancer", "Red", { x: 128, y: 100 }));
    const state = resolveCombat({ units: [blue, red], buildings: [] }, 16);

    const untouchedRed = state.units.find((unit) => unit.id === "red-lancer");
    const attackingBlue = state.units.find((unit) => unit.id === "blue-warrior");

    expect(untouchedRed?.health).toBe(red.health);
    expect(attackingBlue?.attackCooldownMs).toBe(ATTACK_DURATION_MS.Warrior);
    expect(attackingBlue?.moving).toBe(false);
  });

  it("increases melee damage with the Warrior boost", () => {
    const attack = (boosts?: Parameters<typeof resolveCombat>[0]["boosts"]) => {
      const blue = combatUnit(createUnit("blue-warrior", "Warrior", "Blue", { x: 100, y: 100 }));
      const red = combatUnit(createUnit("red-lancer", "Lancer", "Red", { x: 128, y: 100 }));
      const windup = resolveCombat({ units: [blue, red], buildings: [], boosts }, 16);
      const state = resolveCombat({ ...windup, boosts }, ATTACK_DURATION_MS.Warrior);
      const target = state.units.find((unit) => unit.id === "red-lancer")!;
      return red.health - target.health;
    };

    const plain = attack();
    const boosted = attack({ Blue: [{ name: "Warrior", remainingMs: 10000 }] });
    expect(boosted).toBeCloseTo(plain * 1.5, 4);
  });

  it("reduces incoming damage with the ArmorGain boost on the defender", () => {
    const attack = (boosts?: Parameters<typeof resolveCombat>[0]["boosts"]) => {
      const blue = combatUnit(createUnit("blue-warrior", "Warrior", "Blue", { x: 100, y: 100 }));
      const red = combatUnit(createUnit("red-lancer", "Lancer", "Red", { x: 128, y: 100 }));
      const windup = resolveCombat({ units: [blue, red], buildings: [], boosts }, 16);
      const state = resolveCombat({ ...windup, boosts }, ATTACK_DURATION_MS.Warrior);
      const target = state.units.find((unit) => unit.id === "red-lancer")!;
      return red.health - target.health;
    };

    const plain = attack();
    const defended = attack({ Red: [{ name: "ArmorGain", remainingMs: 10000 }] });
    expect(defended).toBeCloseTo(plain * 0.7, 4);
  });

  it("damages enemy melee units at the end of the attack cycle", () => {
    const blue = combatUnit(createUnit("blue-warrior", "Warrior", "Blue", { x: 100, y: 100 }));
    const red = combatUnit(createUnit("red-lancer", "Lancer", "Red", { x: 128, y: 100 }));
    const windup = resolveCombat({ units: [blue, red], buildings: [] }, 16);
    const state = resolveCombat(windup, ATTACK_DURATION_MS.Warrior);
    const damagedRed = state.units.find((unit) => unit.id === "red-lancer");
    const attackingBlue = state.units.find((unit) => unit.id === "blue-warrior");

    expect(damagedRed?.health).toBeLessThan(red.health);
    expect(attackingBlue?.attackCooldownMs).toBe(ATTACK_DURATION_MS.Warrior);
  });

  it("shortens attack cycles by 30 percent while Berserk is active", () => {
    const blue = combatUnit(createUnit("blue-warrior", "Warrior", "Blue", { x: 100, y: 100 }));
    const red = combatUnit(createUnit("red-lancer", "Lancer", "Red", { x: 128, y: 100 }));
    const state = resolveCombat(
      {
        units: [blue, red],
        buildings: [],
        strategies: { Blue: "Berserk" }
      },
      16
    );
    const attackingBlue = state.units.find((unit) => unit.id === "blue-warrior");

    expect(attackingBlue?.attackCooldownMs).toBeCloseTo(ATTACK_DURATION_MS.Warrior / 1.3, 5);
  });

  it("puts attacked guard-capable units into guard stance instead of attacking", () => {
    const blue = combatUnit(createUnit("blue-warrior", "Warrior", "Blue", { x: 100, y: 100 }));
    const red = combatUnit(createUnit("red-warrior", "Warrior", "Red", { x: 128, y: 100 }));
    const windup = resolveCombat(
      {
        units: [blue, red],
        buildings: [],
        strategies: { Blue: "Guard" }
      },
      16
    );
    const state = resolveCombat(windup, 16);
    const blueAfter = state.units.find((unit) => unit.id === "blue-warrior");

    expect(blueAfter?.guarding).toBe(true);
    expect(blueAfter?.targetId).toBeUndefined();
    expect(blueAfter?.attackCooldownMs).toBe(0);
    expect(blueAfter?.moving).toBe(false);
  });

  it("does not speed up priest heal cycles while Berserk is active", () => {
    const priest = combatUnit(createUnit("blue-priest", "Priest", "Blue", { x: 100, y: 100 }));
    const warrior = {
      ...combatUnit(createUnit("blue-warrior", "Warrior", "Blue", { x: 128, y: 100 })),
      health: 80
    };
    const state = resolveCombat(
      {
        units: [priest, warrior],
        buildings: [],
        strategies: { Blue: "Berserk" }
      },
      16
    );
    const priestAfter = state.units.find((unit) => unit.id === "blue-priest");

    expect(priestAfter?.attackCooldownMs).toBe(ATTACK_DURATION_MS.Priest);
  });

  it("halves the fire rate of archers stationed on buildings", () => {
    const roofArcher = combatUnit(
      createUnit("blue-roof-archer", "Archer", "Blue", { x: 100, y: 100 }, "left-base")
    );
    const blueBase = createBuilding("left-base", "Barracks", "Blue", true, { x: 100, y: 100 });
    const red = combatUnit(createUnit("red-lancer", "Lancer", "Red", { x: 180, y: 100 }));
    const state = resolveCombat({ units: [roofArcher, red], buildings: [blueBase] }, 16);
    const archerAfter = state.units.find((unit) => unit.id === "blue-roof-archer");

    expect(archerAfter?.attackCooldownMs).toBe(
      ATTACK_DURATION_MS.Archer * BUILDING_DEFENDER_CYCLE_MULTIPLIER
    );
  });

  it("leads arrows ahead of moving targets", () => {
    const archer = combatUnit(createUnit("blue-archer", "Archer", "Blue", { x: 100, y: 100 }));
    const runner = {
      ...combatUnit(createUnit("red-runner", "Warrior", "Red", { x: 200, y: 100 })),
      velocity: { x: -30, y: 0 }
    };
    const windup = resolveCombat({ units: [archer, runner], buildings: [] }, 16);
    const state = resolveCombat(windup, ATTACK_DURATION_MS.Archer);

    expect(state.projectiles?.length).toBe(1);
    // Runner moves toward the archer, so the predicted impact point sits in
    // front of (left of) the runner's position at fire time.
    expect(state.projectiles![0].destination.x).toBeLessThan(200);
    expect(state.projectiles![0].destination.x).toBeGreaterThan(150);
  });

  it("damages enemy buildings at the end of the attack cycle", () => {
    const blue = combatUnit(createUnit("blue-warrior", "Warrior", "Blue", { x: 100, y: 100 }));
    const redBase = createBuilding("red-base", "Barracks", "Red", true, { x: 140, y: 100 });
    const windup = resolveCombat({ units: [blue], buildings: [redBase] }, 16);
    const state = resolveCombat(windup, ATTACK_DURATION_MS.Warrior);

    expect(state.buildings[0].health).toBeLessThan(redBase.health);
  });

  it("sets winner when a base reaches zero health", () => {
    const blue = combatUnit(createUnit("blue-warrior", "Warrior", "Blue", { x: 100, y: 100 }));
    const redBase = {
      ...createBuilding("red-base", "Barracks", "Red", true, { x: 140, y: 100 }),
      health: 5
    };
    const windup = resolveCombat({ units: [blue], buildings: [redBase] }, 16);
    const state = resolveCombat(windup, ATTACK_DURATION_MS.Warrior);

    expect(state.winner).toBe("Blue");
  });

  it("keeps attacking the locked target while it remains alive and in range", () => {
    const blue = combatUnit(createUnit("blue-warrior", "Warrior", "Blue", { x: 100, y: 100 }));
    const redFarther = combatUnit(createUnit("red-lancer", "Lancer", "Red", { x: 128, y: 100 }));
    const redCloserLater = combatUnit(createUnit("red-warrior", "Warrior", "Red", { x: 112, y: 100 }));
    const first = resolveCombat({ units: [blue, redFarther], buildings: [] }, 16);
    const lockedBlue = first.units.find((unit) => unit.id === "blue-warrior");
    const second = resolveCombat(
      {
        units: [
          { ...lockedBlue!, attackCooldownMs: 0 },
          first.units.find((unit) => unit.id === "red-lancer")!,
          redCloserLater
        ],
        buildings: []
      },
      16
    );
    const third = resolveCombat(second, ATTACK_DURATION_MS.Warrior);

    const originalTarget = third.units.find((unit) => unit.id === "red-lancer");
    const closerTarget = third.units.find((unit) => unit.id === "red-warrior");

    expect(lockedBlue?.targetId).toBe("red-lancer");
    expect(originalTarget?.health).toBeLessThan(redFarther.health);
    expect(closerTarget?.health).toBe(redCloserLater.health);
  });

  it("clears target lock when the target dies", () => {
    const blue = combatUnit(createUnit("blue-warrior", "Warrior", "Blue", { x: 100, y: 100 }));
    const red = {
      ...combatUnit(createUnit("red-lancer", "Lancer", "Red", { x: 128, y: 100 })),
      health: 5
    };
    const windup = resolveCombat({ units: [blue, red], buildings: [] }, 16);
    const state = resolveCombat(windup, ATTACK_DURATION_MS.Warrior);
    const blueAfter = state.units.find((unit) => unit.id === "blue-warrior");

    expect(state.units.find((unit) => unit.id === "red-lancer")).toBeUndefined();
    expect(blueAfter?.targetId).toBeUndefined();
    expect(blueAfter?.moving).toBe(true);
  });

  it("clears target lock when the target moves out of range", () => {
    const blue = {
      ...combatUnit(createUnit("blue-warrior", "Warrior", "Blue", { x: 100, y: 100 })),
      targetId: "red-lancer",
      targetKind: "unit" as const,
      attackCooldownMs: 200,
      moving: false
    };
    const red = combatUnit(createUnit("red-lancer", "Lancer", "Red", { x: 300, y: 100 }));
    const state = resolveCombat({ units: [blue, red], buildings: [] }, 16);
    const blueAfter = state.units.find((unit) => unit.id === "blue-warrior");

    expect(blueAfter?.targetId).toBeUndefined();
    expect(blueAfter?.attackCooldownMs).toBe(0);
    expect(blueAfter?.moving).toBe(true);
  });

  it("lets archers start attacking at original ranged distance", () => {
    const blue = combatUnit(createUnit("blue-archer", "Archer", "Blue", { x: 100, y: 100 }));
    const red = combatUnit(
      createUnit("red-warrior", "Warrior", "Red", {
        x: 100 + ORIGINAL_RADIUS * 3 - 1,
        y: 100
      })
    );
    const state = resolveCombat({ units: [blue, red], buildings: [] }, 16);
    const blueAfter = state.units.find((unit) => unit.id === "blue-archer");
    const redAfter = state.units.find((unit) => unit.id === "red-warrior");

    expect(redAfter?.health).toBe(red.health);
    expect(blueAfter?.targetId).toBe("red-warrior");
    expect(blueAfter?.attackCooldownMs).toBe(ATTACK_DURATION_MS.Archer);
    expect(blueAfter?.moving).toBe(false);
  });

  it("spawns an arrow at the end of the archer attack cycle before projectile impact", () => {
    const blue = combatUnit(createUnit("blue-archer", "Archer", "Blue", { x: 100, y: 100 }));
    const red = combatUnit(createUnit("red-warrior", "Warrior", "Red", { x: 180, y: 100 }));
    const windup = resolveCombat({ units: [blue, red], buildings: [] }, 16);
    const state = resolveCombat(windup, ATTACK_DURATION_MS.Archer);
    const redAfter = state.units.find((unit) => unit.id === "red-warrior");

    expect(redAfter?.health).toBe(red.health);
    expect(state.projectiles).toHaveLength(1);
    expect(state.projectiles?.[0]).toMatchObject({
      color: "Blue",
      kind: "Arrow",
      destination: red.position
    });
  });

  it("lets on-building archers attack enemies in doubled building range while staying stationary", () => {
    const base = createBuilding("left-base", "Barracks", "Blue", true, { x: 224, y: 32 });
    const blue = {
      ...combatUnit(createUnit("blue-roof-archer", "Archer", "Blue", { x: 208, y: 96 }, "left-base")),
      moving: false
    };
    const red = combatUnit(createUnit("red-warrior", "Warrior", "Red", { x: 208 + ORIGINAL_RADIUS * 6 - 1, y: 96 }));
    const state = resolveCombat({ units: [blue, red], buildings: [base] }, 16);
    const blueAfter = state.units.find((unit) => unit.id === "blue-roof-archer");

    expect(blueAfter?.targetId).toBe("red-warrior");
    expect(blueAfter?.moving).toBe(false);
    expect(blueAfter?.attackCooldownMs).toBe(
      ATTACK_DURATION_MS.Archer * BUILDING_DEFENDER_CYCLE_MULTIPLIER
    );
  });

  it("makes ground units attack the base instead of targeting roof defenders", () => {
    const blueBase = createBuilding("blue-base", "Barracks", "Blue", true, { x: 224, y: 32 });
    const redWarrior = combatUnit(createUnit("red-warrior", "Warrior", "Red", { x: 244, y: 160 }));
    const blueRoofArcher = {
      ...combatUnit(createUnit("blue-roof-archer", "Archer", "Blue", { x: 208, y: 64 }, "blue-base")),
      moving: false
    };
    const state = resolveCombat({ units: [redWarrior, blueRoofArcher], buildings: [blueBase] }, 16);
    const redAfter = state.units.find((unit) => unit.id === "red-warrior");

    expect(redAfter?.targetKind).toBe("building");
    expect(redAfter?.targetId).toBe("blue-base");
  });

  it("halves armor and magic resist for Berserk defenders that are not on buildings", () => {
    const blue = combatUnit(createUnit("blue-archer", "Archer", "Blue", { x: 100, y: 100 }));
    const red = combatUnit(createUnit("red-warrior", "Warrior", "Red", { x: 180, y: 100 }));
    const normalWindup = resolveCombat({ units: [blue, red], buildings: [] }, 16);
    const normal = resolveCombat(normalWindup, ATTACK_DURATION_MS.Archer);
    const berserkWindup = resolveCombat(
      {
        units: [blue, red],
        buildings: [],
        strategies: { Red: "Berserk" }
      },
      16
    );
    const berserk = resolveCombat(berserkWindup, ATTACK_DURATION_MS.Archer);

    expect(berserk.projectiles?.[0].damage).toBeGreaterThan(normal.projectiles?.[0].damage ?? 0);
  });

  it("does not halve Berserk defender armor while the target is on a building", () => {
    const blueBase = createBuilding("blue-base", "Barracks", "Blue", true, { x: 224, y: 32 });
    const base = createBuilding("red-base", "Barracks", "Red", true, { x: 1760, y: 32 });
    const blue = {
      ...combatUnit(createUnit("blue-roof-archer", "Archer", "Blue", { x: 100, y: 100 }, "blue-base")),
      moving: false
    };
    const red = {
      ...combatUnit(createUnit("red-warrior", "Warrior", "Red", { x: 180, y: 100 }, "red-base")),
      onBuildingId: "red-base"
    };
    const roofArcherCycle = ATTACK_DURATION_MS.Archer * BUILDING_DEFENDER_CYCLE_MULTIPLIER;
    const normalWindup = resolveCombat({ units: [blue, red], buildings: [blueBase, base] }, 16);
    const normal = resolveCombat(normalWindup, roofArcherCycle);
    const berserkWindup = resolveCombat(
      {
        units: [blue, red],
        buildings: [blueBase, base],
        strategies: { Red: "Berserk" }
      },
      16
    );
    const berserk = resolveCombat(berserkWindup, roofArcherCycle);

    expect(berserk.projectiles?.[0].damage).toBeCloseTo(normal.projectiles?.[0].damage ?? 0, 5);
  });

  it("reduces incoming damage for guard-capable defenders while Guard is active", () => {
    const blue = combatUnit(createUnit("blue-archer", "Archer", "Blue", { x: 100, y: 100 }));
    const red = combatUnit(createUnit("red-warrior", "Warrior", "Red", { x: 180, y: 100 }));
    const normalWindup = resolveCombat({ units: [blue, red], buildings: [] }, 16);
    const normal = resolveCombat(normalWindup, ATTACK_DURATION_MS.Archer);
    const guardedTargetLock = resolveCombat(
      {
        units: [blue, red],
        buildings: [],
        strategies: { Red: "Guard" }
      },
      16
    );
    const guardedWindup = resolveCombat(guardedTargetLock, 16);
    const guarded = resolveCombat(guardedWindup, ATTACK_DURATION_MS.Archer);

    expect(guarded.projectiles?.[0].damage).toBeLessThan(normal.projectiles?.[0].damage ?? Infinity);
  });

  it("applies archer damage when the arrow collides with the target", () => {
    const blue = combatUnit(createUnit("blue-archer", "Archer", "Blue", { x: 100, y: 100 }));
    const red = combatUnit(createUnit("red-warrior", "Warrior", "Red", { x: 180, y: 100 }));
    let state = resolveCombat(resolveCombat({ units: [blue, red], buildings: [] }, 16), ATTACK_DURATION_MS.Archer);

    for (let i = 0; i < 20; i += 1) {
      state = resolveCombat(state, 50);
    }

    const redAfter = state.units.find((unit) => unit.id === "red-warrior");
    expect(redAfter?.health).toBeLessThan(red.health);
    expect(state.projectiles).toHaveLength(0);
  });

  it("does not let melee units start attacking at archer range", () => {
    const blue = combatUnit(createUnit("blue-warrior", "Warrior", "Blue", { x: 100, y: 100 }));
    const red = combatUnit(
      createUnit("red-warrior", "Warrior", "Red", {
        x: 100 + ORIGINAL_RADIUS * 3 - 1,
        y: 100
      })
    );
    const state = resolveCombat({ units: [blue, red], buildings: [] }, 16);
    const blueAfter = state.units.find((unit) => unit.id === "blue-warrior");

    expect(blueAfter?.targetId).toBeUndefined();
    expect(blueAfter?.moving).toBe(true);
  });

  it("removes on-building units when their building is destroyed", () => {
    const blue = {
      ...combatUnit(createUnit("blue-roof-archer", "Archer", "Blue", { x: 208, y: 96 }, "left-base")),
      moving: false
    };
    const destroyedBase = {
      ...createBuilding("left-base", "Barracks", "Blue", true, { x: 224, y: 32 }),
      health: 0
    };
    const state = resolveCombat({ units: [blue], buildings: [destroyedBase] }, 16);

    expect(state.units).toHaveLength(0);
  });

  it("makes March units ignore enemy units instead of starting combat", () => {
    const blue = combatUnit(createUnit("blue-warrior", "Warrior", "Blue", { x: 100, y: 100 }));
    const red = combatUnit(createUnit("red-warrior", "Warrior", "Red", { x: 128, y: 100 }));
    const state = resolveCombat(
      {
        units: [blue, red],
        buildings: [],
        strategies: { Blue: "March", Red: "March" }
      },
      16
    );

    expect(state.units.find((unit) => unit.id === "blue-warrior")?.targetId).toBeUndefined();
    expect(state.units.find((unit) => unit.id === "blue-warrior")?.moving).toBe(true);
    expect(state.units.find((unit) => unit.id === "red-warrior")?.targetId).toBeUndefined();
  });

  it("still lets March units attack enemy buildings like the original movement system", () => {
    const blue = combatUnit(createUnit("blue-warrior", "Warrior", "Blue", { x: 100, y: 100 }));
    const redBase = createBuilding("red-base", "Barracks", "Red", true, { x: 140, y: 100 });
    const state = resolveCombat(
      {
        units: [blue],
        buildings: [redBase],
        strategies: { Blue: "March" }
      },
      16
    );
    const blueAfter = state.units.find((unit) => unit.id === "blue-warrior");

    expect(blueAfter?.targetId).toBe("red-base");
    expect(blueAfter?.targetKind).toBe("building");
    expect(blueAfter?.moving).toBe(false);
  });

  it("starts a priest heal cycle for an injured ally in original range", () => {
    const priest = combatUnit(createUnit("blue-priest", "Priest", "Blue", { x: 100, y: 100 }));
    const warrior = {
      ...combatUnit(createUnit("blue-warrior", "Warrior", "Blue", { x: 100 + ORIGINAL_RADIUS * 3 - 1, y: 100 })),
      health: 80
    };
    const state = resolveCombat({ units: [priest, warrior], buildings: [] }, 16);
    const priestAfter = state.units.find((unit) => unit.id === "blue-priest");
    const warriorAfter = state.units.find((unit) => unit.id === "blue-warrior");

    expect(warriorAfter?.health).toBe(80);
    expect(priestAfter?.targetId).toBe("blue-warrior");
    expect(priestAfter?.attackCooldownMs).toBe(ATTACK_DURATION_MS.Priest);
    expect(priestAfter?.moving).toBe(false);
  });

  it("heals an injured ally at the end of the priest heal cycle and clamps to max health", () => {
    const priest = combatUnit(createUnit("blue-priest", "Priest", "Blue", { x: 100, y: 100 }));
    const warrior = {
      ...combatUnit(createUnit("blue-warrior", "Warrior", "Blue", { x: 128, y: 100 })),
      health: 115
    };
    const windup = resolveCombat({ units: [priest, warrior], buildings: [] }, 16);
    const state = resolveCombat(windup, ATTACK_DURATION_MS.Priest);
    const warriorAfter = state.units.find((unit) => unit.id === "blue-warrior");

    expect(warriorAfter?.health).toBe(warrior.maxHealth);
  });

  it("does not let a priest heal himself", () => {
    const priest = {
      ...combatUnit(createUnit("blue-priest", "Priest", "Blue", { x: 100, y: 100 })),
      health: 10
    };
    const state = resolveCombat({ units: [priest], buildings: [] }, 16);
    const priestAfter = state.units.find((unit) => unit.id === "blue-priest");

    expect(priestAfter?.targetId).toBeUndefined();
    expect(priestAfter?.health).toBe(10);
    expect(priestAfter?.moving).toBe(true);
  });

  it("does not let a priest attack enemies or heal full-health allies", () => {
    const priest = combatUnit(createUnit("blue-priest", "Priest", "Blue", { x: 100, y: 100 }));
    const fullHealthAlly = combatUnit(createUnit("blue-warrior", "Warrior", "Blue", { x: 128, y: 100 }));
    const enemy = combatUnit(createUnit("red-warrior", "Warrior", "Red", { x: 128, y: 100 }));
    const state = resolveCombat({ units: [priest, fullHealthAlly, enemy], buildings: [] }, 16);
    const priestAfter = state.units.find((unit) => unit.id === "blue-priest");
    const enemyAfter = state.units.find((unit) => unit.id === "red-warrior");

    expect(priestAfter?.targetId).toBeUndefined();
    expect(priestAfter?.moving).toBe(true);
    expect(enemyAfter?.health).toBe(enemy.health);
  });
});
