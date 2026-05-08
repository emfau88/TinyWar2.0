import type { PlayerColor } from "../buildings/buildingData";

export type UnitName = "Warrior" | "Lancer" | "Archer" | "Priest";

export interface UnitDefinition {
  name: UnitName;
  description: string;
  spriteSize: number;
  renderSize: number;
  worldSize: number;
  canGuard: boolean;
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
    description:
      "The warrior is a balanced front-line fighter with solid health and damage. With moderate speed and close-range attacks, warriors excel at holding the line and engaging enemies in direct combat.",
    spriteSize: 192,
    renderSize: 96,
    worldSize: 96,
    canGuard: true,
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
    description:
      "Lancers are swift and deadly units. They sacrifice some durability for superior speed and reduced spawning times, making them excellent for quick strikes against enemy formations.",
    spriteSize: 320,
    renderSize: 160,
    worldSize: 96,
    canGuard: false,
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
    description:
      "Archers have low health and damage, but shoot fast arrows at enemies at a distance. Their exceptional range allows them to harass foes from safety, though they are vulnerable in close combat.",
    spriteSize: 192,
    renderSize: 96,
    worldSize: 96,
    canGuard: false,
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
    description:
      "Priests heal damaged units over a range. A priest cannot heal himself. These fragile support units are slow-moving and defenseless, but their powerful healing can turn the tide of battle. Priests do not attack.",
    spriteSize: 192,
    renderSize: 96,
    worldSize: 96,
    canGuard: false,
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

export function unitCanGuard(name: UnitName): boolean {
  return UNITS[name].canGuard;
}

export function unitCycleDurationMs(name: UnitName): number {
  return {
    Warrior: 800,
    Lancer: 900,
    Archer: 600,
    Priest: 1100
  }[name];
}
