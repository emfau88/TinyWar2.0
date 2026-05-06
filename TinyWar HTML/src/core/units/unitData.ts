import type { PlayerColor } from "../buildings/buildingData";

export type UnitName = "Warrior" | "Lancer" | "Archer" | "Priest";

export interface UnitDefinition {
  name: UnitName;
  spriteSize: number;
  renderSize: number;
  worldSize: number;
  speed: number;
  range: number;
  health: number;
  physicalDamage: number;
  magicDamage: number;
  armor: number;
  magicResist: number;
  armorPen: number;
  magicPen: number;
  spawnDurationMs: number;
}

export interface UnitInstance {
  id: string;
  name: UnitName;
  color: PlayerColor;
  health: number;
  maxHealth: number;
  position: {
    x: number;
    y: number;
  };
  onBuildingId?: string;
}

export const UNITS: Record<UnitName, UnitDefinition> = {
  Warrior: {
    name: "Warrior",
    spriteSize: 192,
    renderSize: 96,
    worldSize: 96,
    speed: 30,
    range: 1,
    health: 130,
    physicalDamage: 15,
    magicDamage: 0,
    armor: 5,
    magicResist: 3,
    armorPen: 5,
    magicPen: 0,
    spawnDurationMs: 2500
  },
  Lancer: {
    name: "Lancer",
    spriteSize: 320,
    renderSize: 160,
    worldSize: 96,
    speed: 35,
    range: 1,
    health: 100,
    physicalDamage: 15,
    magicDamage: 0,
    armor: 3,
    magicResist: 3,
    armorPen: 8,
    magicPen: 0,
    spawnDurationMs: 1800
  },
  Archer: {
    name: "Archer",
    spriteSize: 192,
    renderSize: 96,
    worldSize: 96,
    speed: 25,
    range: 3,
    health: 60,
    physicalDamage: 10,
    magicDamage: 0,
    armor: 1,
    magicResist: 0,
    armorPen: 2,
    magicPen: 0,
    spawnDurationMs: 3300
  },
  Priest: {
    name: "Priest",
    spriteSize: 192,
    renderSize: 96,
    worldSize: 96,
    speed: 25,
    range: 3,
    health: 40,
    physicalDamage: -30,
    magicDamage: 0,
    armor: 0,
    magicResist: 12,
    armorPen: 0,
    magicPen: 0,
    spawnDurationMs: 3400
  }
};

export function createUnit(
  id: string,
  name: UnitName,
  color: PlayerColor,
  position: { x: number; y: number },
  onBuildingId?: string
): UnitInstance {
  const definition = UNITS[name];

  return {
    id,
    name,
    color,
    health: definition.health,
    maxHealth: definition.health,
    position,
    onBuildingId
  };
}
