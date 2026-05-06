import type { BuildingInstance } from "../buildings/buildingData";
import type { CombatUnit } from "./combatSystem";
import { distance, unitAttackRange } from "./combatRange";

export function lockedOrNearestEnemyUnit(
  unit: CombatUnit,
  units: readonly CombatUnit[]
): CombatUnit | undefined {
  if (unit.targetKind === "unit" && unit.targetId) {
    const locked = units.find(
      (candidate) =>
        candidate.id === unit.targetId && candidate.color !== unit.color && candidate.health > 0
    );
    if (locked && distance(unit.position, locked.position) <= unitAttackRange(unit, "unit")) {
      return locked;
    }
  }

  return units
    .filter((candidate) => candidate.color !== unit.color && candidate.health > 0)
    .sort((a, b) => distance(unit.position, a.position) - distance(unit.position, b.position))[0];
}

export function lockedOrNearestHealableAlly(
  unit: CombatUnit,
  units: readonly CombatUnit[]
): CombatUnit | undefined {
  if (unit.targetKind === "unit" && unit.targetId) {
    const locked = units.find(
      (candidate) =>
        candidate.id === unit.targetId &&
        candidate.id !== unit.id &&
        candidate.color === unit.color &&
        candidate.health > 0 &&
        candidate.health < candidate.maxHealth
    );
    if (locked && distance(unit.position, locked.position) <= unitAttackRange(unit, "unit")) {
      return locked;
    }
  }

  return units
    .filter(
      (candidate) =>
        candidate.id !== unit.id &&
        candidate.color === unit.color &&
        candidate.health > 0 &&
        candidate.health < candidate.maxHealth
    )
    .filter((candidate) => distance(unit.position, candidate.position) <= unitAttackRange(unit, "unit"))
    .sort((a, b) => distance(unit.position, a.position) - distance(unit.position, b.position))[0];
}

export function lockedOrNearestEnemyBuilding(
  unit: CombatUnit,
  buildings: readonly BuildingInstance[]
): BuildingInstance | undefined {
  if (unit.targetKind === "building" && unit.targetId) {
    const locked = buildings.find(
      (building) =>
        building.id === unit.targetId && building.color !== unit.color && building.health > 0
    );
    if (locked && distance(unit.position, locked.position) <= unitAttackRange(unit, "building")) {
      return locked;
    }
  }

  return buildings
    .filter((building) => building.color !== unit.color && building.health > 0)
    .sort((a, b) => distance(unit.position, a.position) - distance(unit.position, b.position))[0];
}

export function clearInvalidTargets(
  units: readonly CombatUnit[],
  buildings: readonly BuildingInstance[]
): CombatUnit[] {
  const liveUnitIds = new Set(units.map((unit) => unit.id));
  const liveBuildingIds = new Set(
    buildings.filter((building) => building.health > 0).map((building) => building.id)
  );

  return units.map((unit) => {
    const lockedUnit = unit.targetKind === "unit" && unit.targetId
      ? units.find((candidate) => candidate.id === unit.targetId)
      : undefined;
    const lockedBuilding = unit.targetKind === "building" && unit.targetId
      ? buildings.find((building) => building.id === unit.targetId)
      : undefined;
    const targetOutOfRange =
      (lockedUnit && distance(unit.position, lockedUnit.position) > unitAttackRange(unit, "unit")) ||
      (lockedBuilding && distance(unit.position, lockedBuilding.position) > unitAttackRange(unit, "building"));
    const priestTargetInvalid =
      unit.name === "Priest" &&
      unit.targetKind === "unit" &&
      unit.targetId &&
      (!lockedUnit ||
        lockedUnit.id === unit.id ||
        lockedUnit.color !== unit.color ||
        lockedUnit.health >= lockedUnit.maxHealth);

    if (
      (unit.targetKind === "unit" && unit.targetId && !liveUnitIds.has(unit.targetId)) ||
      (unit.targetKind === "building" && unit.targetId && !liveBuildingIds.has(unit.targetId)) ||
      targetOutOfRange ||
      priestTargetInvalid
    ) {
      return {
        ...unit,
        attackCooldownMs: 0,
        targetId: undefined,
        targetKind: undefined,
        moving: true
      };
    }

    return unit;
  });
}
