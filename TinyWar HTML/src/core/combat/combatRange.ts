import type { CombatUnit } from "./combatSystem";
import { UNITS } from "../units/unitData";

export const MELEE_BUILDING_RANGE = 78;
export const MELEE_UNIT_RANGE = 44;
export const ORIGINAL_RADIUS = 48;

export function unitAttackRange(unit: CombatUnit, targetKind: "unit" | "building"): number {
  const range = UNITS[unit.name].range * (unit.onBuildingId ? 2 : 1);

  if (range === 1) {
    return targetKind === "unit" ? MELEE_UNIT_RANGE : MELEE_BUILDING_RANGE;
  }

  return range * ORIGINAL_RADIUS;
}

export function distance(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}
