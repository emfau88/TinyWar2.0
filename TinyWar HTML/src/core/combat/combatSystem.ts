import type { BuildingInstance } from "../buildings/buildingData";
import { calculateDamage } from "./damage";
import type { PlayerColor } from "../buildings/buildingData";
import type { PlayerStrategy } from "../player/playerStrategy";
import { UNITS, type UnitInstance } from "../units/unitData";
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
  Warrior: 8 * FRAME_MS,
  Lancer: 9 * FRAME_MS,
  Archer: 6 * FRAME_MS,
  Priest: 11 * FRAME_MS
};

export interface CombatUnit extends UnitInstance {
  attackCooldownMs: number;
  moving: boolean;
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

  for (const unit of units) {
    if (unit.health <= 0) {
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
      units = resetAttackCycle(units, unit.id, healTarget.id, "unit");
      continue;
    }

    const targetUnit = strategyForUnit(state, unit) === "March" ? undefined : lockedOrNearestEnemyUnit(unit, units);
    if (targetUnit && unitCanAttack(unit) && distance(unit.position, targetUnit.position) <= unitAttackRange(unit, "unit")) {
      if (unit.attackCooldownMs > 0) {
        units = holdAttack(units, unit.id, targetUnit.id, "unit");
        continue;
      }

      if (unit.targetKind === "unit" && unit.targetId === targetUnit.id) {
        const result = resolveCompletedAttack({ units, buildings, projectiles }, unit, targetUnit);
        units = result.units;
        buildings = result.buildings;
        projectiles = result.projectiles;
      }
      units = resetAttackCycle(units, unit.id, targetUnit.id, "unit");
      continue;
    }

    const targetBuilding = lockedOrNearestEnemyBuilding(unit, buildings);
    if (targetBuilding && unitCanAttack(unit) && distance(unit.position, targetBuilding.position) <= unitAttackRange(unit, "building")) {
      if (unit.attackCooldownMs > 0) {
        units = holdAttack(units, unit.id, targetBuilding.id, "building");
        continue;
      }

      if (unit.targetKind === "building" && unit.targetId === targetBuilding.id) {
        const result = resolveCompletedAttack({ units, buildings, projectiles }, unit, targetBuilding);
        units = result.units;
        buildings = result.buildings;
        projectiles = result.projectiles;
      }
      units = resetAttackCycle(units, unit.id, targetBuilding.id, "building");
      const destroyedBase = buildings.find((building) => building.id === targetBuilding.id);
      if (destroyedBase?.isBase && destroyedBase.health <= 0) {
        winner = unit.color === "Blue" ? "Blue" : "Red";
      }
    }
  }

  return {
    units: clearInvalidTargets(units.filter((unit) => unit.health > 0), buildings),
    buildings,
    projectiles,
    winner
  };
}

function resolveCompletedAttack(
  state: {
    units: readonly CombatUnit[];
    buildings: readonly BuildingInstance[];
    projectiles: readonly ProjectileInstance[];
  },
  attacker: CombatUnit,
  target: CombatUnit | BuildingInstance
): {
  units: CombatUnit[];
  buildings: BuildingInstance[];
  projectiles: ProjectileInstance[];
} {
  if (attacker.name === "Archer") {
    const damage = damageForTarget(attacker, target);
    const direction = target.position.x < attacker.position.x ? -1 : 1;
    return {
      units: [...state.units],
      buildings: [...state.buildings],
      projectiles: [
        ...state.projectiles,
        createArrowProjectile(
          attacker.color,
          damage,
          {
            x: attacker.position.x + 0.25 * ORIGINAL_RADIUS * direction,
            y: attacker.position.y - 0.25 * ORIGINAL_RADIUS
          },
          target.position
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
    units: damageUnit(state.units, target.id, attacker),
    buildings: [...state.buildings],
    projectiles: [...state.projectiles]
  };
}

function damageForTarget(attacker: CombatUnit, target: CombatUnit | BuildingInstance): number {
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
    armor: definition.armor,
    magicResist: definition.magicResist
  });
}

function damageUnit(units: readonly CombatUnit[], targetId: string, attacker: CombatUnit): CombatUnit[] {
  return units.map((unit) => {
    if (unit.id !== targetId) {
      return unit;
    }

    const definition = UNITS[unit.name];
    const damage = calculateDamage(
      toDamageStats(attacker),
      {
        ...toDamageStats(unit),
        armor: definition.armor,
        magicResist: definition.magicResist
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
  targetKind: "unit" | "building"
): CombatUnit[] {
  return units.map((unit) =>
    unit.id === unitId
      ? {
          ...unit,
          attackCooldownMs: ATTACK_DURATION_MS[unit.name],
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

export { MELEE_BUILDING_RANGE, MELEE_UNIT_RANGE, ORIGINAL_RADIUS } from "./combatRange";
