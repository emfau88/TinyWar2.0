import type { PlayerColor } from "../buildings/buildingData";

export type UnitName =
  | "Warrior"
  | "Lancer"
  | "Archer"
  | "Priest"
  | "Snake"
  | "Bear"
  | "Troll"
  | "Gnoll"
  | "Gnome"
  | "Goblin"
  | "Hammerhead"
  | "Minotaur"
  | "Shaman"
  | "Shark"
  | "Skull"
  | "Spider"
  | "Turtle";

export const MONSTER_UNITS: readonly UnitName[] = [
  "Snake",
  "Bear",
  "Troll",
  "Gnoll",
  "Gnome",
  "Goblin",
  "Hammerhead",
  "Minotaur",
  "Shaman",
  "Shark",
  "Skull",
  "Spider",
  "Turtle"
];

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
  },
  Gnoll: {
    name: "Gnoll",
    description:
      "A scavengy creature that attacks by hurling bones at its enemies. Gnolls have lower range than archers and sharks, but deal more damage.",
    spriteSize: 192,
    renderSize: 96,
    worldSize: 96,
    canGuard: false,
    speed: 25,
    range: 2.5,
    health: 110,
    physicalDamage: 12,
    magicDamage: 0,
    armor: 2,
    magicResist: 2,
    armorPen: 4,
    magicPen: 2,
    spawnDurationMs: 3300
  },
  Gnome: {
    name: "Gnome",
    description: "A small and fragile magical creature that attacks with a wooden hammer.",
    spriteSize: 192,
    renderSize: 96,
    worldSize: 96,
    canGuard: false,
    speed: 40,
    range: 1,
    health: 60,
    physicalDamage: 7,
    magicDamage: 0,
    armor: 1,
    magicResist: 1,
    armorPen: 1,
    magicPen: 0,
    spawnDurationMs: 1000
  },
  Goblin: {
    name: "Goblin",
    description: "A bad-tempered goblin that uses its spear to pierce through any armor.",
    spriteSize: 256,
    renderSize: 128,
    worldSize: 96,
    canGuard: false,
    speed: 35,
    range: 1,
    health: 100,
    physicalDamage: 15,
    magicDamage: 0,
    armor: 4,
    magicResist: 4,
    armorPen: 12,
    magicPen: 0,
    spawnDurationMs: 2000
  },
  Hammerhead: {
    name: "Hammerhead",
    description:
      "A magical sea creature that strikes with a heavy oar, as surprising as it is lethal.",
    spriteSize: 192,
    renderSize: 96,
    worldSize: 96,
    canGuard: false,
    speed: 35,
    range: 1,
    health: 100,
    physicalDamage: 0,
    magicDamage: 15,
    armor: 3,
    magicResist: 7,
    armorPen: 8,
    magicPen: 8,
    spawnDurationMs: 1900
  },
  Minotaur: {
    name: "Minotaur",
    description:
      "A giant magical brute with a giant hammer, delivering strikes with overwhelming force. Minotaurs are strong both in offense and defense.",
    spriteSize: 320,
    renderSize: 160,
    worldSize: 160,
    canGuard: true,
    speed: 25,
    range: 1,
    health: 200,
    physicalDamage: 0,
    magicDamage: 30,
    armor: 12,
    magicResist: 12,
    armorPen: 10,
    magicPen: 10,
    spawnDurationMs: 7900
  },
  Shaman: {
    name: "Shaman",
    description:
      "Shamans are powerful goblin mages who cast devastating spells from a safe distance. Shamans deal massive magic damage but are easy to kill in close combat.",
    spriteSize: 192,
    renderSize: 96,
    worldSize: 96,
    canGuard: false,
    speed: 30,
    range: 2.5,
    health: 70,
    physicalDamage: 0,
    magicDamage: 22,
    armor: 0,
    magicResist: 17,
    armorPen: 6,
    magicPen: 8,
    spawnDurationMs: 7000
  },
  Shark: {
    name: "Shark",
    description: "A long-range magical predator that launches harpoons with deadly precision.",
    spriteSize: 192,
    renderSize: 96,
    worldSize: 96,
    canGuard: false,
    speed: 25,
    range: 3,
    health: 60,
    physicalDamage: 0,
    magicDamage: 10,
    armor: 0,
    magicResist: 2,
    armorPen: 5,
    magicPen: 5,
    spawnDurationMs: 3500
  },
  Skull: {
    name: "Skull",
    description:
      "Skulls are fragile units used primarily as fodder or to overwhelm enemies with in huge numbers.",
    spriteSize: 192,
    renderSize: 96,
    worldSize: 96,
    canGuard: true,
    speed: 40,
    range: 1,
    health: 60,
    physicalDamage: 8,
    magicDamage: 2,
    armor: 0,
    magicResist: 0,
    armorPen: 0,
    magicPen: 0,
    spawnDurationMs: 800
  },
  Spider: {
    name: "Spider",
    description: "A giant arachnid that bites and poisons its victims with every strike.",
    spriteSize: 192,
    renderSize: 96,
    worldSize: 96,
    canGuard: false,
    speed: 30,
    range: 1,
    health: 100,
    physicalDamage: 0,
    magicDamage: 18,
    armor: 5,
    magicResist: 2,
    armorPen: 3,
    magicPen: 3,
    spawnDurationMs: 2500
  },
  Turtle: {
    name: "Turtle",
    description:
      "Turtles are slow and have low damage, but are incredibly resilient. Their high armor and magic resist make them the perfect units to block a path.",
    spriteSize: 320,
    renderSize: 160,
    worldSize: 160,
    canGuard: true,
    speed: 15,
    range: 1,
    health: 350,
    physicalDamage: 5,
    magicDamage: 5,
    armor: 20,
    magicResist: 20,
    armorPen: 0,
    magicPen: 0,
    spawnDurationMs: 6500
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
  // Attack (Priest: heal) frame count x 100ms, mirroring the original's
  // animation-driven attack cadence.
  return {
    Warrior: 800,
    Lancer: 900,
    Archer: 600,
    Priest: 1100,
    Snake: 600,
    Bear: 900,
    Troll: 600,
    Gnoll: 600,
    Gnome: 700,
    Goblin: 800,
    Hammerhead: 600,
    Minotaur: 1200,
    Shaman: 600,
    Shark: 400,
    Skull: 700,
    Spider: 800,
    Turtle: 1000
  }[name];
}
