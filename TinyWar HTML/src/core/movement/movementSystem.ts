import { getLaneWorldPath, type LaneName } from "../map/pathfinding";
import type { PlayerColor } from "../buildings/buildingData";
import type { PlayerStrategy } from "../player/playerStrategy";
import { createUnit, UNITS, type UnitInstance, type UnitName } from "../units/unitData";

const ARRIVAL_DISTANCE = 2;

export interface MovingUnit extends UnitInstance {
  lane: LaneName;
  pathIndex: number;
  direction: "LeftToRight" | "RightToLeft";
  moving: boolean;
  guarding?: boolean;
  attackCooldownMs: number;
  targetId?: string;
  targetKind?: "unit" | "building";
}

export function createLaneUnit(
  unitName: UnitName,
  lane: LaneName,
  index = 0,
  idPrefix = "unit",
  color: PlayerColor = "Blue"
): MovingUnit {
  const direction = color === "Red" ? "RightToLeft" : "LeftToRight";
  const sourcePath = getLaneWorldPath(lane);
  const path = direction === "RightToLeft" ? [...sourcePath].reverse() : sourcePath;
  const [start] = path;

  return {
    ...createUnit(`${idPrefix}-${unitName.toLowerCase()}-${lane.toLowerCase()}-${index}`, unitName, color, {
      x: start.x + (color === "Red" ? -index * 16 : index * 16),
      y: start.y + index * 12
    }),
    lane,
    pathIndex: 1,
    direction,
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
  const path = unit.direction === "RightToLeft" ? [...sourcePath].reverse() : sourcePath;
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
