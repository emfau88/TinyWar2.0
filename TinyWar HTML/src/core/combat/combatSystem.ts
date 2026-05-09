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
  updateProjectiles,
  type ProjectileInstance
} from "./projectileSystem";

export const FRAME_MS = 100;
export const ATTACK_DURATION_MS: Record<UnitInstance["name"], number> = {
  Warrior: unitCycleDurationMs("Warrior"),
  Lancer: unitCycleDurationMs("Lancer"),
  Archer: unitCycleDurationMs("Archer"),
  Priest: unitCycleDurationMs("Priest")
};

export interface CombatUnit extends UnitInstance {
  attackCooldownMs: number;
  moving: boolean;
  guarding?: boolean;
  targetId?: string;
  targetKind?: "unit" | "building";
}

export interface CombatState {
  units: readonly CombatUnit[];
  buildings: readonly BuildingInstance[];
  projectiles?: readonly ProjectileInstance[];
  strategies?: Partial<Record<PlayerColor, PlayerStrategy>>;
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
    if (targetUnit && unitCanAttack(unit) && distance(unit.position, targetUnit.position) <= unitAttackRange(unit, "unit")) {
      if (unit.attackCooldownMs > 0) {
        units = holdAttack(units, unit.id, targetUnit.id, "unit");
        continue;
      }

      if (unit.targetKind === "unit" && unit.targetId === targetUnit.id) {
        const result = resolveCompletedAttack({ units, buildings, projectiles, strategies: state.strategies }, unit, targetUnit);
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
      distance(unit.position, getBuildingCombatPosition(targetBuilding)) <= unitAttackRange(unit, "building")
    ) {
      if (unit.attackCooldownMs > 0) {
        units = holdAttack(units, unit.id, targetBuilding.id, "building");
        continue;
      }

      if (unit.targetKind === "building" && unit.targetId === targetBuilding.id) {
        const result = resolveCompletedAttack({ units, buildings, projectiles, strategies: state.strategies }, unit, targetBuilding);
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
  },
  attacker: CombatUnit,
  target: CombatUnit | BuildingInstance
): {
  units: CombatUnit[];
  buildings: BuildingInstance[];
  projectiles: ProjectileInstance[];
} {
  if (attacker.name === "Archer") {
    const damage = damageForTarget(attacker, target, state.strategies);
    const direction = target.position.x < attacker.position.x ? -1 : 1;
    return {
      units: [...state.units],
      buildings: [...state.buildings],
      projectiles: [
        ...state.projectiles,
        createArrowProjectile(
          attacker.color,
          damage,
          Boolean(attacker.onBuildingId),
          {
            x: attacker.position.x + 0.25 * ORIGINAL_RADIUS * direction,
            y: attacker.position.y - 0.25 * ORIGINAL_RADIUS
          },
          "isBase" in target ? getBuildingCombatPosition(target) : target.position
        )
      ]
    };
  }

  if ("maxHealth" in target && "isBase" in target) {
    return {
      units: [...state.units],
      buildings: damageBuilding(state.buildings, target.id, attacker),
      projectiles: [...state.projectiles]
    };
  }

  return {
    units: damageUnit(state.units, target.id, attacker, state.strategies),
    buildings: [...state.buildings],
    projectiles: [...state.projectiles]
  };
}

function damageForTarget(
  attacker: CombatUnit,
  target: CombatUnit | BuildingInstance,
  strategies?: Partial<Record<PlayerColor, PlayerStrategy>>
): number {
  if ("isBase" in target) {
    return calculateDamage(toDamageStats(attacker), {
      physicalDamage: 0,
      magicDamage: 0,
      armor: 0,
      magicResist: 0,
      armorPen: 0,
      magicPen: 0
    });
  }

  const definition = UNITS[target.name];
  return calculateDamage(toDamageStats(attacker), {
    ...toDamageStats(target),
    armor: adjustedArmor(definition.armor, target, strategies),
    magicResist: adjustedMagicResist(definition.magicResist, target, strategies)
  });
}

function damageUnit(
  units: readonly CombatUnit[],
  targetId: string,
  attacker: CombatUnit,
  strategies?: Partial<Record<PlayerColor, PlayerStrategy>>
): CombatUnit[] {
  return units.map((unit) => {
    if (unit.id !== targetId) {
      return unit;
    }

    const definition = UNITS[unit.name];
    const damage = calculateDamage(
      toDamageStats(attacker),
      {
        ...toDamageStats(unit),
        armor: adjustedArmor(definition.armor, unit, strategies),
        magicResist: adjustedMagicResist(definition.magicResist, unit, strategies)
      }
    );

    return {
      ...unit,
      health: Math.max(0, unit.health - damage)
    };
  });
}

function damageBuilding(
  buildings: readonly BuildingInstance[],
  targetId: string,
  attacker: CombatUnit
): BuildingInstance[] {
  return buildings.map((building) => {
    if (building.id !== targetId || building.health <= 0) {
      return building;
    }

    const damage = calculateDamage(toDamageStats(attacker), {
      physicalDamage: 0,
      magicDamage: 0,
      armor: 0,
      magicResist: 0,
      armorPen: 0,
      magicPen: 0
    });

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

function attackDurationForUnit(state: CombatState, unit: CombatUnit): number {
  const duration = ATTACK_DURATION_MS[unit.name];
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
