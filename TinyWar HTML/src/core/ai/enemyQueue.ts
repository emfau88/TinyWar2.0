import { createQueue, enqueueUnit, tickQueue, type UnitQueue } from "../queue/unitQueue";
import { UNITS, type UnitName } from "../units/unitData";

const ENEMY_QUEUEABLE_UNITS: readonly UnitName[] = ["Warrior", "Lancer", "Archer", "Priest"];

export interface EnemyQueueState {
  queue: UnitQueue;
}

export function createEnemyQueue(): EnemyQueueState {
  return {
    queue: createQueue()
  };
}

export function tickEnemyQueue(
  state: EnemyQueueState,
  deltaMs: number,
  random = Math.random
): { state: EnemyQueueState; spawned: readonly UnitName[] } {
  let queue = state.queue;

  if (queue.units.length === 0) {
    queue = enqueueUnit(queue, chooseEnemyQueueUnit(random));
  }

  const result = tickQueue(queue, deltaMs);

  return {
    state: {
      queue: result.queue
    },
    spawned: result.spawned
  };
}

export function chooseEnemyQueueUnit(random = Math.random): UnitName {
  const weightedUnits = ENEMY_QUEUEABLE_UNITS.map((unit) => ({
    unit,
    weight: 1 / UNITS[unit].spawnDurationMs
  }));
  const totalWeight = weightedUnits.reduce((sum, item) => sum + item.weight, 0);
  let cursor = random() * totalWeight;

  for (const item of weightedUnits) {
    cursor -= item.weight;
    if (cursor <= 0) {
      return item.unit;
    }
  }

  return weightedUnits[weightedUnits.length - 1].unit;
}
