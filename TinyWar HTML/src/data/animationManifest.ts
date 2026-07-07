import { UNITS, type UnitName } from "../core/units/unitData";
import type { PlayerColor } from "../core/buildings/buildingData";

export type UnitAction = "Idle" | "Run" | "Guard" | "Attack" | "Heal";

export interface UnitAnimationDefinition {
  key: string;
  path: string;
  frameWidth: number;
  frameHeight: number;
  frames: number;
  frameRate: number;
}

import { isMonsterUnit } from "../core/units/unitData";

const ROOT = "/assets/tinywar/images/units";
const FRAME_MS = 100;

export function unitAnimationKey(color: PlayerColor, unit: UnitName, action: UnitAction): string {
  // Monsters share one neutral sprite set regardless of faction color.
  if (isMonsterUnit(unit)) {
    return `unit-monster-${unit.toLowerCase()}-${action.toLowerCase()}`;
  }

  return `unit-${color.toLowerCase()}-${unit.toLowerCase()}-${action.toLowerCase()}`;
}

export const BASIC_UNIT_ANIMATIONS = [
  unitAnimation("Blue", "Warrior", "Idle", 8),
  unitAnimation("Blue", "Warrior", "Run", 6),
  unitAnimation("Blue", "Warrior", "Guard", 6),
  unitAnimation("Blue", "Warrior", "Attack", 8),
  unitAnimation("Blue", "Lancer", "Idle", 12),
  unitAnimation("Blue", "Lancer", "Run", 6),
  unitAnimation("Blue", "Lancer", "Attack", 9),
  unitAnimation("Blue", "Archer", "Idle", 6),
  unitAnimation("Blue", "Archer", "Run", 4),
  unitAnimation("Blue", "Archer", "Attack", 6),
  unitAnimation("Blue", "Priest", "Idle", 6),
  unitAnimation("Blue", "Priest", "Run", 4),
  unitAnimation("Blue", "Priest", "Heal", 11),
  unitAnimation("Red", "Warrior", "Idle", 8),
  unitAnimation("Red", "Warrior", "Run", 6),
  unitAnimation("Red", "Warrior", "Guard", 6),
  unitAnimation("Red", "Warrior", "Attack", 8),
  unitAnimation("Red", "Lancer", "Idle", 12),
  unitAnimation("Red", "Lancer", "Run", 6),
  unitAnimation("Red", "Lancer", "Attack", 9),
  unitAnimation("Red", "Archer", "Idle", 6),
  unitAnimation("Red", "Archer", "Run", 4),
  unitAnimation("Red", "Archer", "Attack", 6),
  unitAnimation("Red", "Priest", "Idle", 6),
  unitAnimation("Red", "Priest", "Run", 4),
  unitAnimation("Red", "Priest", "Heal", 11),
  monsterAnimation("Snake", "Idle", 8),
  monsterAnimation("Snake", "Run", 8),
  monsterAnimation("Snake", "Attack", 6),
  monsterAnimation("Bear", "Idle", 8),
  monsterAnimation("Bear", "Run", 5),
  monsterAnimation("Bear", "Attack", 9),
  monsterAnimation("Troll", "Idle", 12),
  monsterAnimation("Troll", "Run", 10),
  monsterAnimation("Troll", "Attack", 6)
] as const satisfies readonly UnitAnimationDefinition[];

function unitAnimation(
  color: PlayerColor,
  unit: UnitName,
  action: UnitAction,
  frames: number
): UnitAnimationDefinition {
  const size = UNITS[unit].spriteSize;

  return {
    key: unitAnimationKey(color, unit, action),
    path: `${ROOT}/${color}/${unit}_${action}.png`,
    frameWidth: size,
    frameHeight: size,
    frames,
    frameRate: 1000 / FRAME_MS
  };
}

function monsterAnimation(unit: UnitName, action: UnitAction, frames: number): UnitAnimationDefinition {
  const size = UNITS[unit].spriteSize;

  return {
    key: unitAnimationKey("Red", unit, action),
    path: `${ROOT}/Monsters/${unit}/${unit}_${action}.png`,
    frameWidth: size,
    frameHeight: size,
    frames,
    frameRate: 1000 / FRAME_MS
  };
}
