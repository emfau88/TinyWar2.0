import { getLaneWorldPath, type LaneName } from "../map/pathfinding";
import type { PlayerColor } from "../buildings/buildingData";
import type { PlayerStrategy } from "../player/playerStrategy";
import { createUnit, UNITS, type UnitInstance, type UnitName } from "../units/unitData";

const ARRIVAL_DISTANCE = 2;

export interface MovingUnit extends UnitInstance {
  lane: LaneName;
  pathIndex: number;
  direction: "LeftToRight" | "RightToLeft";
  terminalPosition?: { x: number; y: number };
  moving: boolean;
  guarding?: boolean;
  attackCooldownMs: number;
  targetId?: string;
  targetKind?: "unit" | "building";
  velocity?: { x: number; y: number };
}

export function stationaryBuildingUnit(
  unit: UnitInstance,
  lane: LaneName = "Mid"
): MovingUnit {
  return {
    ...unit,
    lane,
    pathIndex: 0,
    direction: unit.color === "Blue" ? "LeftToRight" : "RightToLeft",
    moving: false,
    attackCooldownMs: 0
  };
}

export function createLaneUnit(
  unitName: UnitName,
  lane: LaneName,
  index = 0,
  idPrefix = "unit",
  color: PlayerColor = "Blue",
  spawnPosition?: { x: number; y: number },
  terminalPosition?: { x: number; y: number }
): MovingUnit {
  // Every non-player faction walks the lane from its far end toward the player.
  const direction = color === "Blue" ? "LeftToRight" : "RightToLeft";
  const sourcePath = getLaneWorldPath(lane);
  const path = direction === "RightToLeft" ? [...sourcePath].reverse() : sourcePath;
  const [start] = path;
  const unitStart = spawnPosition ?? start;
  const pathIndex = spawnPosition ? resolveSpawnPathIndex(path, unitStart) : 1;

  return {
    ...createUnit(`${idPrefix}-${unitName.toLowerCase()}-${lane.toLowerCase()}-${index}`, unitName, color, {
      x: unitStart.x + (color !== "Blue" ? -index * 16 : index * 16),
      y: unitStart.y + index * 12
    }),
    lane,
    pathIndex,
    direction,
    terminalPosition,
    moving: true,
    attackCooldownMs: 0
  };
}

export function createDebugLaneUnit(lane: LaneName, index = 0): MovingUnit {
  return createLaneUnit("Warrior", lane, index);
}

export function createDebugMidLaneUnit(): MovingUnit {
  return createDebugLaneUnit("Mid");
}

export function updateMovingUnit(
  unit: MovingUnit,
  deltaSeconds: number,
  strategy: PlayerStrategy = "Attack"
): MovingUnit {
  const sourcePath = getLaneWorldPath(unit.lane);
  const path = pathWithTerminalPosition(unit, sourcePath);
  const targetIndex = Math.min(unit.pathIndex, path.length - 1);
  const target = path[targetIndex];

  if (!target || !unit.moving) {
    return {
      ...unit,
      moving: false
    };
  }

  const dx = target.x - unit.position.x;
  const dy = target.y - unit.position.y;
  const distance = Math.hypot(dx, dy);

  if (distance <= ARRIVAL_DISTANCE) {
    const nextIndex = targetIndex + 1;
    return {
      ...unit,
      position: target,
      pathIndex: nextIndex,
      moving: nextIndex < path.length
    };
  }

  const strategySpeedMultiplier = strategy === "March" ? 1.5 : 1;
  const step = Math.min(
    distance,
    UNITS[unit.name].speed * strategySpeedMultiplier * Math.min(deltaSeconds, 0.05)
  );
  const nextPosition = {
    x: unit.position.x + (dx / distance) * step,
    y: unit.position.y + (dy / distance) * step
  };

  return {
    ...unit,
    position: nextPosition,
    moving: true
  };
}

function pathWithTerminalPosition(
  unit: Pick<MovingUnit, "direction" | "terminalPosition">,
  sourcePath: readonly { x: number; y: number }[]
): readonly { x: number; y: number }[] {
  const path = unit.direction === "RightToLeft" ? [...sourcePath].reverse() : [...sourcePath];
  const terminal = unit.terminalPosition;
  if (!terminal) {
    return path;
  }

  const last = path[path.length - 1];
  if (last && Math.hypot(last.x - terminal.x, last.y - terminal.y) <= ARRIVAL_DISTANCE) {
    return path;
  }

  path.push(terminal);
  return path;
}

function resolveSpawnPathIndex(
  path: readonly { x: number; y: number }[],
  spawnPosition: { x: number; y: number }
): number {
  if (path.length <= 1) {
    return 1;
  }

  let nearestIndex = 0;
  let nearestDistance = Number.POSITIVE_INFINITY;
  for (let index = 0; index < path.length; index += 1) {
    const point = path[index];
    const distance = Math.hypot(point.x - spawnPosition.x, point.y - spawnPosition.y);
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearestIndex = index;
    }
  }

  return Math.min(nearestIndex + 1, path.length - 1);
}
