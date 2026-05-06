import { UNITS, type UnitName } from "../units/unitData";

export const MAX_QUEUE_LENGTH = 10;

export interface QueuedUnit {
  unit: UnitName;
  remainingMs: number;
}

export interface UnitQueue {
  readonly units: readonly QueuedUnit[];
}

export function createQueue(): UnitQueue {
  return {
    units: []
  };
}

export function enqueueUnit(queue: UnitQueue, unit: UnitName): UnitQueue {
  if (queue.units.length >= MAX_QUEUE_LENGTH) {
    return queue;
  }

  return {
    units: [
      ...queue.units,
      {
        unit,
        remainingMs: UNITS[unit].spawnDurationMs
      }
    ]
  };
}

export function tickQueue(
  queue: UnitQueue,
  deltaMs: number
): { queue: UnitQueue; spawned: readonly UnitName[] } {
  if (queue.units.length === 0) {
    return { queue, spawned: [] };
  }

  const [first, ...rest] = queue.units;
  const remainingMs = first.remainingMs - deltaMs;

  if (remainingMs <= 0) {
    return {
      queue: {
        units: rest
      },
      spawned: [first.unit]
    };
  }

  return {
    queue: {
      units: [{ ...first, remainingMs }, ...rest]
    },
    spawned: []
  };
}
