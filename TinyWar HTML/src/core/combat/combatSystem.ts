import { getBuildingCombatPosition, type BuildingInstance } from "../buildings/buildingData";
import { calculateDamage } from "./damage";
import type { PlayerColor } from "../buildings/buildingData";
import type { PlayerStrategy } from "../player/playerStrategy";
import { UNITS, unitCanGuard, unitCycleDurationMs, type UnitInstance } from "../units/unitData";
import { distance, ORIGINAL_RADIUS, unitAttackRange } from "./combatRange";
import {
  clearInvalidTargets,
  lockedOrNearestHealableAlly,
  lockedOrNearestEnemyBuilding,
  lockedOrNearestEnemyUnit
} from "./combatTargeting";
import {
  createArrowProjectile,
  leadProjectileDestination,
  updateProjectiles,
  type ProjectileInstance
} from "./projectileSystem";
import {
  bonusArmorPen,
  damageMultiplier,
  damageTakenMultiplier,
  rangeMultiplier,
  type ActiveBoostsByColor
} from "../boosts/boostModifiers";

export const FRAME_MS = 100;
export const ATTACK_DURATION_MS: Record<UnitInstance["name"], number> = {
  Warrior: unitCycleDurationMs("Warrior"),
  Lancer: unitCycleDurationMs("Lancer"),
  Archer: unitCycleDurationMs("Archer"),
  Priest: unitCycleDurationMs("Priest"),
  Snake: unitCycleDurationMs("Snake"),
  Bear: unitCycleDurationMs("Bear"),
  Troll: unitCycleDurationMs("Troll")
};

export interface CombatUnit extends UnitInstance {
  attackCooldownMs: number;
  moving: boolean;
  guarding?: boolean;
  targetId?: string;
  targetKind?: "unit" | "building";
  velocity?: { x: number; y: number };
}

export interface CombatState {
  units: readonly CombatUnit[];
  buildings: readonly BuildingInstance[];
  projectiles?: readonly ProjectileInstance[];
  strategies?: Partial<Record<PlayerColor, PlayerStrategy>>;
  boosts?: ActiveBoostsByColor;
  winner?: "Blue" | "Red";
}

export function resolveCombat(state: CombatState, deltaMs: number): CombatState {
  const projectileState = updateProjectiles(
    {
      units: state.units,
      buildings: state.buildings,
      projectiles: state.projectiles ?? [],
      winner: state.winner
    },
    deltaMs
  );
  let units = projectileState.units.map((unit) => ({
    ...unit,
    attackCooldownMs: Math.max(0, unit.attackCooldownMs - deltaMs)
  }));
  let buildings = [...projectileState.buildings];
  let projectiles = [...projectileState.projectiles];
  let winner = projectileState.winner;

  const attackedUnitIds = new Set(
    units
      .filter((unit) => unitCanAttack(unit) && unit.targetKind === "unit" && unit.targetId)
      .map((unit) => unit.targetId as string)
  );

  units = units.map((unit) => {
    const guarding = shouldGuard(unit, attackedUnitIds, state.strategies);
    return guarding !== Boolean(unit.guarding)
      ? {
          ...unit,
          guarding,
          moving: !guarding,
          attackCooldownMs: guarding ? 0 : unit.attackCooldownMs,
          targetId: guarding ? undefined : unit.targetId,
          targetKind: guarding ? undefined : unit.targetKind
        }
      : unit;
  });

  for (const unit of units) {
    if (unit.health <= 0) {
      continue;
    }

    if (unit.guarding) {
      continue;
    }

    const healTarget = unitCanHeal(unit) ? lockedOrNearestHealableAlly(unit, units) : undefined;
    if (healTarget) {
      if (unit.attackCooldownMs > 0) {
        units = holdAttack(units, unit.id, healTarget.id, "unit");
        continue;
      }

      if (unit.targetKind === "unit" && unit.targetId === healTarget.id) {
        units = healUnit(units, healTarget.id, unit);
      }
      units = resetAttackCycle(units, unit.id, healTarget.id, "unit", ATTACK_DURATION_MS[unit.name]);
      continue;
    }

    const targetUnit = strategyForUnit(state, unit) === "March" ? undefined : lockedOrNearestEnemyUnit(unit, units);
    if (targetUnit && unitCanAttack(unit) && distance(unit.position, targetUnit.position) <= boostedRange(unit, "unit", state.boosts)) {
      if (unit.attackCooldownMs > 0) {
        units = holdAttack(units, unit.id, targetUnit.id, "unit");
        continue;
      }

      if (unit.targetKind === "unit" && unit.targetId === targetUnit.id) {
        const result = resolveCompletedAttack(
          { units, buildings, projectiles, strategies: state.strategies, boosts: state.boosts },
          unit,
          targetUnit
        );
        units = result.units;
        buildings = result.buildings;
        projectiles = result.projectiles;
      }
      units = resetAttackCycle(units, unit.id, targetUnit.id, "unit", attackDurationForUnit(state, unit));
      continue;
    }

    const targetBuilding = lockedOrNearestEnemyBuilding(unit, buildings);
    if (
      targetBuilding &&
      unitCanAttack(unit) &&
      distance(unit.position, getBuildingCombatPosition(targetBuilding)) <= boostedRange(unit, "building", state.boosts)
    ) {
      if (unit.attackCooldownMs > 0) {
        units = holdAttack(units, unit.id, targetBuilding.id, "building");
        continue;
      }

      if (unit.targetKind === "building" && unit.targetId === targetBuilding.id) {
        const result = resolveCompletedAttack(
          { units, buildings, projectiles, strategies: state.strategies, boosts: state.boosts },
          unit,
          targetBuilding
        );
        units = result.units;
        buildings = result.buildings;
        projectiles = result.projectiles;
      }
      units = resetAttackCycle(units, unit.id, targetBuilding.id, "building", attackDurationForUnit(state, unit));
      const destroyedBase = buildings.find((building) => building.id === targetBuilding.id);
      if (destroyedBase?.isBase && destroyedBase.health <= 0) {
        winner = unit.color === "Blue" ? "Blue" : "Red";
      }
    }
  }

  return {
    units: clearInvalidTargets(
      units.filter(
        (unit) =>
          unit.health > 0 &&
          (!unit.onBuildingId ||
            buildings.some((building) => building.id === unit.onBuildingId && building.health > 0))
      ),
      buildings
    ),
    buildings,
    projectiles,
    strategies: state.strategies,
    winner
  };
}

function resolveCompletedAttack(
  state: {
    units: readonly CombatUnit[];
    buildings: readonly BuildingInstance[];
    projectiles: readonly ProjectileInstance[];
    strategies?: Partial<Record<PlayerColor, PlayerStrategy>>;
    boosts?: ActiveBoostsByColor;
  },
  attacker: CombatUnit,
  target: CombatUnit | BuildingInstance
): {
  units: CombatUnit[];
  buildings: BuildingInstance[];
  projectiles: ProjectileInstance[];
} {
  if (attacker.name === "Archer") {
    const damage = damageForTarget(attacker, target, state.strategies, state.boosts);
    const direction = target.position.x < attacker.position.x ? -1 : 1;
    const start = {
      x: attacker.position.x + 0.25 * ORIGINAL_RADIUS * direction,
      y: attacker.position.y - 0.25 * ORIGINAL_RADIUS
    };
    const destination =
      "isBase" in target
        ? getBuildingCombatPosition(target)
        : leadProjectileDestination(start, target.position, target.velocity);
    return {
      units: [...state.units],
      buildings: [...state.buildings],
      projectiles: [
        ...state.projectiles,
        createArrowProjectile(attacker.color, damage, Boolean(attacker.onBuildingId), start, destination)
      ]
    };
  }

  if ("maxHealth" in target && "isBase" in target) {
    return {
      units: [...state.units],
      buildings: damageBuilding(state.buildings, target.id, attacker, state.boosts),
      projectiles: [...state.projectiles]
    };
  }

  return {
    units: damageUnit(state.units, target.id, attacker, state.strategies, state.boosts),
    buildings: [...state.buildings],
    projectiles: [...state.projectiles]
  };
}

function damageForTarget(
  attacker: CombatUnit,
  target: CombatUnit | BuildingInstance,
  strategies?: Partial<Record<PlayerColor, PlayerStrategy>>,
  boosts?: ActiveBoostsByColor
): number {
  if ("isBase" in target) {
    const raw = calculateDamage(boostedAttackerStats(attacker, boosts), {
      physicalDamage: 0,
      magicDamage: 0,
      armor: 0,
      magicResist: 0,
      armorPen: 0,
      magicPen: 0
    });
    return raw * boostDamageScale(attacker, undefined, boosts);
  }

  const definition = UNITS[target.name];
  const raw = calculateDamage(boostedAttackerStats(attacker, boosts), {
    ...toDamageStats(target),
    armor: adjustedArmor(definition.armor, target, strategies),
    magicResist: adjustedMagicResist(definition.magicResist, target, strategies)
  });
  return raw * boostDamageScale(attacker, target.color, boosts);
}

function damageUnit(
  units: readonly CombatUnit[],
  targetId: string,
  attacker: CombatUnit,
  strategies?: Partial<Record<PlayerColor, PlayerStrategy>>,
  boosts?: ActiveBoostsByColor
): CombatUnit[] {
  return units.map((unit) => {
    if (unit.id !== targetId) {
      return unit;
    }

    const definition = UNITS[unit.name];
    const raw = calculateDamage(
      boostedAttackerStats(attacker, boosts),
      {
        ...toDamageStats(unit),
        armor: adjustedArmor(definition.armor, unit, strategies),
        magicResist: adjustedMagicResist(definition.magicResist, unit, strategies)
      }
    );
    const damage = raw * boostDamageScale(attacker, unit.color, boosts);

    return {
      ...unit,
      health: Math.max(0, unit.health - damage)
    };
  });
}

function damageBuilding(
  buildings: readonly BuildingInstance[],
  targetId: string,
  attacker: CombatUnit,
  boosts?: ActiveBoostsByColor
): BuildingInstance[] {
  return buildings.map((building) => {
    if (building.id !== targetId || building.health <= 0) {
      return building;
    }

    const raw = calculateDamage(boostedAttackerStats(attacker, boosts), {
      physicalDamage: 0,
      magicDamage: 0,
      armor: 0,
      magicResist: 0,
      armorPen: 0,
      magicPen: 0
    });
    const damage = raw * boostDamageScale(attacker, building.color, boosts);

    return {
      ...building,
      health: Math.max(0, building.health - damage)
    };
  });
}

function healUnit(units: readonly CombatUnit[], targetId: string, healer: CombatUnit): CombatUnit[] {
  return units.map((unit) => {
    if (unit.id !== targetId) {
      return unit;
    }

    return {
      ...unit,
      health: Math.min(unit.maxHealth, unit.health - UNITS[healer.name].physicalDamage)
    };
  });
}

function resetAttackCycle(
  units: readonly CombatUnit[],
  unitId: string,
  targetId: string,
  targetKind: "unit" | "building",
  durationMs: number
): CombatUnit[] {
  return units.map((unit) =>
    unit.id === unitId
      ? {
          ...unit,
          attackCooldownMs: durationMs,
          guarding: false,
          moving: false,
          targetId,
          targetKind
        }
      : unit
  );
}

function holdAttack(
  units: readonly CombatUnit[],
  unitId: string,
  targetId: string,
  targetKind: "unit" | "building"
): CombatUnit[] {
  return units.map((unit) =>
    unit.id === unitId
      ? {
          ...unit,
          guarding: false,
          moving: false,
          targetId,
          targetKind
        }
      : unit
  );
}

function toDamageStats(unit: UnitInstance) {
  const definition = UNITS[unit.name];

  return {
    physicalDamage: definition.physicalDamage,
    magicDamage: definition.magicDamage,
    armor: definition.armor,
    magicResist: definition.magicResist,
    armorPen: definition.armorPen,
    magicPen: definition.magicPen
  };
}

/** Attack range with the archer Longbow boost folded in. */
function boostedRange(
  unit: CombatUnit,
  targetKind: "unit" | "building",
  boosts?: ActiveBoostsByColor
): number {
  return unitAttackRange(unit, targetKind) * rangeMultiplier(boosts?.[unit.color], unit.name);
}

/** Attacker stats with active-boost armor penetration folded in. */
function boostedAttackerStats(attacker: CombatUnit, boosts?: ActiveBoostsByColor) {
  const stats = toDamageStats(attacker);
  const attackerBoosts = boosts?.[attacker.color];
  return {
    ...stats,
    armorPen: stats.armorPen + bonusArmorPen(attackerBoosts)
  };
}

/**
 * Combined damage scaling from active boosts: the attacker's outgoing buff
 * (Warrior/Lancer/Arrows) times the defender's damage-taken reduction (ArmorGain).
 */
function boostDamageScale(
  attacker: CombatUnit,
  defenderColor: PlayerColor | undefined,
  boosts?: ActiveBoostsByColor
): number {
  const outgoing = damageMultiplier(boosts?.[attacker.color], attacker.name);
  const incoming = defenderColor ? damageTakenMultiplier(boosts?.[defenderColor]) : 1;
  return outgoing * incoming;
}

function unitCanAttack(unit: CombatUnit): boolean {
  return unit.name !== "Priest";
}

function unitCanHeal(unit: CombatUnit): boolean {
  return unit.name === "Priest";
}

function strategyForUnit(state: CombatState, unit: CombatUnit): PlayerStrategy {
  return state.strategies?.[unit.color] ?? "Attack";
}

function strategyForColor(
  strategies: Partial<Record<PlayerColor, PlayerStrategy>> | undefined,
  color: PlayerColor
): PlayerStrategy {
  return strategies?.[color] ?? "Attack";
}

export const BUILDING_DEFENDER_CYCLE_MULTIPLIER = 2;

function attackDurationForUnit(state: CombatState, unit: CombatUnit): number {
  let duration = ATTACK_DURATION_MS[unit.name];
  // Base-roof defenders fire at half rate so they suppress instead of shredding
  // whole waves on their own - tuned for the slower gold-economy pacing.
  if (unit.onBuildingId) {
    duration *= BUILDING_DEFENDER_CYCLE_MULTIPLIER;
  }

  return strategyForUnit(state, unit) === "Berserk" && unit.name !== "Priest" ? duration / 1.3 : duration;
}

function adjustedArmor(
  armor: number,
  defender: CombatUnit,
  strategies?: Partial<Record<PlayerColor, PlayerStrategy>>
): number {
  let adjusted = armor;
  if (defender.guarding) {
    adjusted *= 2;
  }

  return strategyForColor(strategies, defender.color) === "Berserk" && !defender.onBuildingId
    ? adjusted / 2
    : adjusted;
}

function adjustedMagicResist(
  magicResist: number,
  defender: CombatUnit,
  strategies?: Partial<Record<PlayerColor, PlayerStrategy>>
): number {
  let adjusted = magicResist;
  if (defender.guarding) {
    adjusted *= 2;
  }

  return strategyForColor(strategies, defender.color) === "Berserk" && !defender.onBuildingId
    ? adjusted / 2
    : adjusted;
}

function shouldGuard(
  unit: CombatUnit,
  attackedUnitIds: ReadonlySet<string>,
  strategies?: Partial<Record<PlayerColor, PlayerStrategy>>
): boolean {
  return unitCanGuard(unit.name) && strategyForColor(strategies, unit.color) === "Guard" && attackedUnitIds.has(unit.id);
}


export { MELEE_BUILDING_RANGE, MELEE_UNIT_RANGE, ORIGINAL_RADIUS } from "./combatRange";
