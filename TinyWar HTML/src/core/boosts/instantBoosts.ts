import type { BuildingInstance, PlayerColor } from "../buildings/buildingData";
import type { CombatUnit } from "../combat/combatSystem";
import { getActiveMap } from "../map/activeMap";
import { getLaneWorldPath, type LaneName } from "../map/pathfinding";
import { UNITS, isMonsterUnit, type UnitName } from "../units/unitData";
import type { BoostName } from "./boostData";

// Instant boosts change the world once, with no timer. The pure transforms
// (heal / repair / lightning / conversions) return new unit/building arrays.
// Effects that introduce new units return spawn *requests*, which the scene
// fulfills with its own unit factory - keeping this module free of rendering
// concerns.

export const INSTANT_ARMY_COUNT = 6;
export const CLONE_MAX = 8;
// Swarm sizes are port-scaled versions of the original's 20/20/10/3, matching
// the already-reduced snake and troll counts on the smaller map.
export const SNAKE_SWARM_COUNT = 8;
export const SPAWN_TROLLS_COUNT = 2;
export const SKULL_SWARM_COUNT = 12;
export const SPIDER_SWARM_COUNT = 6;
export const SPAWN_TURTLES_COUNT = 2;
export const MINOTAUR_RAGE_PER_ENEMIES = 3;

const ARMY_POOL: readonly UnitName[] = ["Warrior", "Lancer", "Archer", "Priest"];

export interface SpawnRequest {
  unit: UnitName;
  color: PlayerColor;
  /** Optional world position; when omitted the scene spawns at the base door. */
  position?: { x: number; y: number };
  /** Optional lane; keeps a scattered spawn walking the path it spawned on. */
  lane?: LaneName;
}

/**
 * Scatter swarm spawns along the map's lane paths, like the original's
 * "randomly over the map" summons - one request per unit at a random path
 * point (away from both ends) with a little jitter so nothing stacks.
 */
function scatteredRequests(
  unit: UnitName,
  count: number,
  color: PlayerColor,
  random: () => number = Math.random
): readonly SpawnRequest[] {
  const lanes = getActiveMap().availableLanes;
  return Array.from({ length: count }, () => {
    const lane = lanes[Math.floor(random() * lanes.length)] ?? lanes[0];
    const path = getLaneWorldPath(lane);
    const margin = Math.min(3, Math.floor((path.length - 1) / 3));
    const span = Math.max(1, path.length - 2 * margin);
    const point = path[Math.min(path.length - 1, margin + Math.floor(random() * span))];
    return {
      unit,
      color,
      lane,
      position: {
        x: point.x + (random() - 0.5) * 56,
        y: point.y + (random() - 0.5) * 40
      }
    };
  });
}

export interface InstantBoostResult {
  units: readonly CombatUnit[];
  buildings: readonly BuildingInstance[];
  spawns: readonly SpawnRequest[];
}

/** Heal every unit of the given color back to full health. */
export function applyInstantHealing(
  units: readonly CombatUnit[],
  color: PlayerColor
): readonly CombatUnit[] {
  return units.map((unit) =>
    unit.color === color ? { ...unit, health: unit.maxHealth } : unit
  );
}

/** Repair every building of the given color back to full health. */
export function applyRepair(
  buildings: readonly BuildingInstance[],
  color: PlayerColor
): readonly BuildingInstance[] {
  return buildings.map((building) =>
    building.color === color ? { ...building, health: building.maxHealth } : building
  );
}

/** Halve the health of every unit on the map (rounded down, min 1). */
export function applyLightning(units: readonly CombatUnit[]): readonly CombatUnit[] {
  return units.map((unit) => ({
    ...unit,
    health: Math.max(1, Math.floor(unit.health / 2))
  }));
}

/** Spawn requests for 6 random basic units at the color's base. */
export function instantArmyRequests(
  color: PlayerColor,
  random: () => number = Math.random
): readonly SpawnRequest[] {
  return Array.from({ length: INSTANT_ARMY_COUNT }, () => ({
    unit: ARMY_POOL[Math.floor(random() * ARMY_POOL.length)],
    color
  }));
}

/** Spawn requests cloning up to 8 of the color's marching units, in place. */
export function cloneRequests(
  units: readonly CombatUnit[],
  color: PlayerColor
): readonly SpawnRequest[] {
  return units
    .filter((unit) => unit.color === color && !unit.onBuildingId)
    .slice(0, CLONE_MAX)
    .map((unit) => ({
      unit: unit.name,
      color,
      position: { x: unit.position.x, y: unit.position.y }
    }));
}

/** Spawn requests for a snake swarm scattered along the paths. */
export function snakeSwarmRequests(
  color: PlayerColor,
  random: () => number = Math.random
): readonly SpawnRequest[] {
  return scatteredRequests("Snake", SNAKE_SWARM_COUNT, color, random);
}

/** Spawn requests for trolls marching from the color's base. */
export function trollRequests(color: PlayerColor): readonly SpawnRequest[] {
  return Array.from({ length: SPAWN_TROLLS_COUNT }, () => ({ unit: "Troll" as UnitName, color }));
}

/** Spawn a bear next to each priest of the given color, in place. */
export function bearDefenderRequests(
  units: readonly CombatUnit[],
  color: PlayerColor
): readonly SpawnRequest[] {
  return units
    .filter((unit) => unit.color === color && unit.name === "Priest")
    .map((priest) => ({
      unit: "Bear" as UnitName,
      color,
      position: { x: priest.position.x + UNITS.Bear.worldSize * 0.4, y: priest.position.y }
    }));
}

/** Spawn requests for a skull swarm scattered along the paths. */
export function skullSwarmRequests(
  color: PlayerColor,
  random: () => number = Math.random
): readonly SpawnRequest[] {
  return scatteredRequests("Skull", SKULL_SWARM_COUNT, color, random);
}

/** Spawn requests for a spider swarm scattered along the paths. */
export function spiderSwarmRequests(
  color: PlayerColor,
  random: () => number = Math.random
): readonly SpawnRequest[] {
  return scatteredRequests("Spider", SPIDER_SWARM_COUNT, color, random);
}

/** Spawn requests for turtles marching from the color's base. */
export function turtleRequests(color: PlayerColor): readonly SpawnRequest[] {
  return Array.from({ length: SPAWN_TURTLES_COUNT }, () => ({ unit: "Turtle" as UnitName, color }));
}

/**
 * Spawn requests for MinotaurRage: one minotaur per 3 enemy monster units on
 * the field, at least one - mirroring the original's non-basic unit count.
 */
export function minotaurRageRequests(
  units: readonly CombatUnit[],
  color: PlayerColor
): readonly SpawnRequest[] {
  const enemyMonsters = units.filter(
    (unit) => unit.color !== color && isMonsterUnit(unit.name)
  ).length;
  const count = Math.max(1, Math.floor(enemyMonsters / MINOTAUR_RAGE_PER_ENEMIES));
  return Array.from({ length: count }, () => ({ unit: "Minotaur" as UnitName, color }));
}

export interface ConversionResult {
  units: readonly CombatUnit[];
  /** Ids whose unit type changed - the scene re-renders these sprites. */
  changedIds: readonly string[];
}

function convertUnits(
  units: readonly CombatUnit[],
  shouldConvert: (unit: CombatUnit) => boolean,
  to: UnitName,
  scaleHealth: boolean
): ConversionResult {
  const changedIds: string[] = [];
  const targetDefinition = UNITS[to];
  const converted = units.map((unit) => {
    if (!shouldConvert(unit)) {
      return unit;
    }
    changedIds.push(unit.id);
    // Like the original: plain conversions keep the current health while the
    // gnome curse rescales it proportionally to the new maximum.
    const health = scaleHealth
      ? (unit.health / unit.maxHealth) * targetDefinition.health
      : Math.min(unit.health, targetDefinition.health);
    return {
      ...unit,
      name: to,
      health,
      maxHealth: targetDefinition.health,
      guarding: false,
      moving: true,
      attackCooldownMs: 0,
      targetId: undefined,
      targetKind: undefined
    };
  });
  return { units: converted, changedIds };
}

/** Transform all of the color's lancers into goblins. */
export function applyConvertGoblins(
  units: readonly CombatUnit[],
  color: PlayerColor
): ConversionResult {
  return convertUnits(units, (unit) => unit.color === color && unit.name === "Lancer", "Goblin", false);
}

/** Transform all of the color's ground archers into sharks. */
export function applyConvertSharks(
  units: readonly CombatUnit[],
  color: PlayerColor
): ConversionResult {
  return convertUnits(
    units,
    (unit) => unit.color === color && unit.name === "Archer" && !unit.onBuildingId,
    "Shark",
    false
  );
}

/** Curse all enemy basic ground units into gnomes (health scaled). */
export function applyGnomesBasic(
  units: readonly CombatUnit[],
  casterColor: PlayerColor
): ConversionResult {
  return convertUnits(
    units,
    (unit) => unit.color !== casterColor && !isMonsterUnit(unit.name) && !unit.onBuildingId,
    "Gnome",
    true
  );
}

/** Does this instant boost need the scene's spawn machinery? */
export function isSpawningBoost(name: BoostName): boolean {
  return (
    name === "InstantArmy" ||
    name === "Clone" ||
    name === "Snakes" ||
    name === "SpawnTrolls" ||
    name === "BearDefender" ||
    name === "Skulls" ||
    name === "Spiders" ||
    name === "SpawnTurtles" ||
    name === "MinotaurRage"
  );
}
