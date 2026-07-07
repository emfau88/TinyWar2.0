import type { BuildingInstance } from "../buildings/buildingData";
import type { PlayerColor } from "../buildings/buildingData";
import type { CombatUnit } from "./combatSystem";

export type ProjectileKind = "Arrow";

export interface ProjectileInstance {
  id: string;
  color: PlayerColor;
  kind: ProjectileKind;
  damage: number;
  sourceOnBuilding: boolean;
  start: { x: number; y: number };
  destination: { x: number; y: number };
  position: { x: number; y: number };
  totalDistance: number;
  traveled: number;
  landedMs: number;
}

export interface ProjectileUpdateState {
  projectiles: readonly ProjectileInstance[];
  units: readonly CombatUnit[];
  buildings: readonly BuildingInstance[];
  winner?: "Blue" | "Red";
}

export const PROJECTILE_SPEED = 160;
export const PROJECTILE_ON_GROUND_MS = 2000;
export const PROJECTILE_HIT_RADIUS = 48 * 0.4;

let projectileCounter = 0;

export function createArrowProjectile(
  color: PlayerColor,
  damage: number,
  sourceOnBuilding: boolean,
  start: { x: number; y: number },
  destination: { x: number; y: number }
): ProjectileInstance {
  return {
    id: `projectile-arrow-${projectileCounter++}`,
    color,
    kind: "Arrow",
    damage,
    sourceOnBuilding,
    start,
    destination,
    position: start,
    totalDistance: Math.max(1, distance(start, destination)),
    traveled: 0,
    landedMs: 0
  };
}

export function updateProjectiles(state: ProjectileUpdateState, deltaMs: number): ProjectileUpdateState {
  let units = [...state.units];
  let buildings = [...state.buildings];
  let winner = state.winner;
  const projectiles: ProjectileInstance[] = [];

  for (const projectile of state.projectiles) {
    const updated = advanceProjectile(projectile, deltaMs);

    if (updated.traveled >= updated.totalDistance) {
      const landedMs = updated.landedMs + deltaMs;
      if (landedMs < PROJECTILE_ON_GROUND_MS) {
        projectiles.push({ ...updated, landedMs });
      }
      continue;
    }

    const hitUnit = units.find(
      (unit) =>
        unit.color !== updated.color &&
        unit.health > 0 &&
        (updated.sourceOnBuilding || !unit.onBuildingId) &&
        distance(unit.position, updated.position) < PROJECTILE_HIT_RADIUS
    );

    if (hitUnit) {
      units = units.map((unit) =>
        unit.id === hitUnit.id
          ? {
              ...unit,
              health: Math.max(0, unit.health - updated.damage)
            }
          : unit
      );
      continue;
    }

    const hitBuilding = buildings.find(
      (building) =>
        building.color !== updated.color &&
        building.health > 0 &&
        distance(building.position, updated.position) < PROJECTILE_HIT_RADIUS
    );

    if (hitBuilding) {
      buildings = buildings.map((building) =>
        building.id === hitBuilding.id
          ? {
              ...building,
              health: Math.max(0, building.health - updated.damage)
            }
          : building
      );
      const damagedBuilding = buildings.find((building) => building.id === hitBuilding.id);
      if (damagedBuilding?.isBase && damagedBuilding.health <= 0) {
        winner = updated.color === "Blue" ? "Blue" : "Red";
      }
      continue;
    }

    projectiles.push(updated);
  }

  return {
    projectiles,
    units: units.filter((unit) => unit.health > 0),
    buildings,
    winner
  };
}

function advanceProjectile(projectile: ProjectileInstance, deltaMs: number): ProjectileInstance {
  const traveled = Math.min(
    projectile.totalDistance,
    projectile.traveled + PROJECTILE_SPEED * (deltaMs / 1000)
  );

  return {
    ...projectile,
    traveled,
    position: arcPosition(projectile, traveled)
  };
}

function arcPosition(projectile: ProjectileInstance, traveled: number): { x: number; y: number } {
  const progress = Math.min(1, traveled / projectile.totalDistance);
  const horizontal = lerp(projectile.start, projectile.destination, progress);
  const arcHeight = progress * (1 - progress) * 4 * projectile.totalDistance * 0.2;

  return {
    x: horizontal.x,
    y: horizontal.y - arcHeight
  };
}

export function projectileFacing(projectile: ProjectileInstance): { x: number; y: number } | undefined {
  if (projectile.traveled >= projectile.totalDistance) {
    return undefined;
  }

  // Like the original: sample one world unit ahead along the arc so the arrow
  // points along its actual flight path instead of straight at the target.
  const current = arcPosition(projectile, projectile.traveled);
  const ahead = arcPosition(projectile, projectile.traveled + 1);
  const facing = { x: ahead.x - current.x, y: ahead.y - current.y };

  return Math.hypot(facing.x, facing.y) > 0.001 ? facing : undefined;
}

export function leadProjectileDestination(
  start: { x: number; y: number },
  targetPosition: { x: number; y: number },
  targetVelocity?: { x: number; y: number }
): { x: number; y: number } {
  if (!targetVelocity || (targetVelocity.x === 0 && targetVelocity.y === 0)) {
    return targetPosition;
  }

  // Two-pass linear prediction: estimate flight time to the current position,
  // then refine against the predicted position.
  let predicted = targetPosition;
  for (let pass = 0; pass < 2; pass += 1) {
    const flightTimeSec = distance(start, predicted) / PROJECTILE_SPEED;
    predicted = {
      x: targetPosition.x + targetVelocity.x * flightTimeSec,
      y: targetPosition.y + targetVelocity.y * flightTimeSec
    };
  }

  return predicted;
}

function lerp(a: { x: number; y: number }, b: { x: number; y: number }, t: number): { x: number; y: number } {
  return {
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t
  };
}

function distance(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}
