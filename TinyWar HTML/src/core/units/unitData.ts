import type { PlayerColor } from "../buildings/buildingData";

export type UnitName = "Warrior" | "Lancer" | "Archer" | "Priest" | "Snake" | "Bear" | "Troll";

export const MONSTER_UNITS: readonly UnitName[] = ["Snake", "Bear", "Troll"];

export function isMonsterUnit(name: UnitName): boolean {
  return MONSTER_UNITS.includes(name);
}

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
  },
  Snake: {
    name: "Snake",
    description:
      "A quick, venomous serpent that overwhelms enemies in numbers. Snakes are fragile but fast, and their magical venom bypasses plain armor.",
    spriteSize: 192,
    renderSize: 96,
    worldSize: 96,
    canGuard: false,
    speed: 45,
    range: 1,
    health: 45,
    physicalDamage: 0,
    magicDamage: 8,
    armor: 0,
    magicResist: 0,
    armorPen: 0,
    magicPen: 0,
    spawnDurationMs: 500
  },
  Bear: {
    name: "Bear",
    description:
      "A massive forest bully that crushes enemies with its enormous, powerful claws. Bears soak up damage on the front line and hit hard.",
    spriteSize: 256,
    renderSize: 128,
    worldSize: 96,
    canGuard: false,
    speed: 40,
    range: 1,
    health: 200,
    physicalDamage: 20,
    magicDamage: 0,
    armor: 10,
    magicResist: 6,
    armorPen: 9,
    magicPen: 0,
    spawnDurationMs: 3400
  },
  Troll: {
    name: "Troll",
    description:
      "A hulking terror of the deep woods. Trolls advance slowly but shrug off almost any attack and flatten whole formations with their club.",
    spriteSize: 384,
    renderSize: 192,
    worldSize: 192,
    canGuard: false,
    speed: 20,
    range: 1,
    health: 500,
    physicalDamage: 25,
    magicDamage: 10,
    armor: 17,
    magicResist: 17,
    armorPen: 12,
    magicPen: 12,
    spawnDurationMs: 10000
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
    Priest: 1100,
    Snake: 600,
    Bear: 900,
    Troll: 600
  }[name];
}
