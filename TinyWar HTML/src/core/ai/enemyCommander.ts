import {
  UNIT_COSTS,
  createGoldState,
  spendForUnit,
  tickGold,
  type GoldState
} from "../economy/goldEconomy";
import {
  MAX_QUEUE_LENGTH,
  createQueue,
  enqueueUnit,
  tickQueue,
  type UnitQueue
} from "../queue/unitQueue";
import type { UnitName } from "../units/unitData";

export const BASE_WAVE_BUDGET = 150;
export const WAVE_BUDGET_VARIANCE = 100;
export const REST_MIN_MS = 5000;
export const REST_VARIANCE_MS = 4000;
export const ESCALATION_PER_MINUTE = 0.15;
export const MAX_ESCALATION = 2.5;

const FRONTLINE_UNITS: readonly UnitName[] = ["Warrior", "Lancer"];
const MAX_PRIESTS_PER_WAVE = 1;

/** From this point the classic opponent mixes a few monsters into its waves. */
export const MONSTER_MIX_UNLOCK_MS = 5 * 60000;

// Basic units dominate throughout; monsters not listed here are never queued.
const WAVE_WEIGHTS: Record<UnitName, number> = {
  Warrior: 3,
  Lancer: 3,
  Archer: 2,
  Priest: 1,
  Snake: 0,
  Bear: 0,
  Troll: 0,
  Gnoll: 0,
  Gnome: 0,
  Goblin: 0,
  Hammerhead: 0,
  Minotaur: 0,
  Shaman: 0,
  Shark: 0,
  Skull: 0,
  Spider: 0,
  Turtle: 0
};

// Small late-game weights: an occasional goblin, skull or gnoll keeps waves
// varied without displacing the basic-unit core (weights 3/3/2/1 above).
const LATE_MONSTER_WEIGHTS: Partial<Record<UnitName, number>> = {
  Goblin: 1,
  Skull: 1,
  Gnoll: 1
};

function waveWeight(unit: UnitName, elapsedMs: number): number {
  if (WAVE_WEIGHTS[unit] > 0) {
    return WAVE_WEIGHTS[unit];
  }
  return elapsedMs >= MONSTER_MIX_UNLOCK_MS ? LATE_MONSTER_WEIGHTS[unit] ?? 0 : 0;
}

export type EnemyPhase = "saving" | "spawning" | "resting";

export interface EnemyCommanderState {
  readonly gold: GoldState;
  readonly queue: UnitQueue;
  readonly phase: EnemyPhase;
  readonly waveBudget: number;
  readonly restRemainingMs: number;
  readonly elapsedMs: number;
}

export function createEnemyCommander(incomeMultiplier = 1): EnemyCommanderState {
  return {
    gold: createGoldState(incomeMultiplier),
    queue: createQueue(),
    phase: "saving",
    waveBudget: BASE_WAVE_BUDGET,
    restRemainingMs: 0,
    elapsedMs: 0
  };
}

export function escalationFactor(elapsedMs: number): number {
  return Math.min(MAX_ESCALATION, 1 + (elapsedMs / 60000) * ESCALATION_PER_MINUTE);
}

export function rollWaveBudget(elapsedMs: number, random = Math.random): number {
  return Math.round((BASE_WAVE_BUDGET + random() * WAVE_BUDGET_VARIANCE) * escalationFactor(elapsedMs));
}

export function rollRestDuration(random = Math.random): number {
  return REST_MIN_MS + random() * REST_VARIANCE_MS;
}

function pickWeighted(
  candidates: readonly UnitName[],
  elapsedMs: number,
  random: () => number
): UnitName {
  const totalWeight = candidates.reduce((sum, unit) => sum + waveWeight(unit, elapsedMs), 0);
  let cursor = random() * totalWeight;

  for (const unit of candidates) {
    cursor -= waveWeight(unit, elapsedMs);
    if (cursor <= 0) {
      return unit;
    }
  }

  return candidates[candidates.length - 1];
}

export function composeWave(
  budget: number,
  elapsedMs: number,
  random = Math.random
): readonly UnitName[] {
  const wave: UnitName[] = [pickWeighted(FRONTLINE_UNITS, elapsedMs, random)];
  let remaining = budget - UNIT_COSTS[wave[0]];

  while (wave.length < MAX_QUEUE_LENGTH) {
    const priests = wave.filter((unit) => unit === "Priest").length;
    const candidates = (Object.keys(WAVE_WEIGHTS) as UnitName[]).filter(
      (unit) =>
        waveWeight(unit, elapsedMs) > 0 &&
        UNIT_COSTS[unit] <= remaining &&
        (unit !== "Priest" || priests < MAX_PRIESTS_PER_WAVE)
    );
    if (candidates.length === 0) {
      break;
    }

    const pick = pickWeighted(candidates, elapsedMs, random);
    wave.push(pick);
    remaining -= UNIT_COSTS[pick];
  }

  return wave;
}

export function tickEnemyCommander(
  state: EnemyCommanderState,
  deltaMs: number,
  random = Math.random
): { state: EnemyCommanderState; spawned: readonly UnitName[] } {
  if (deltaMs <= 0) {
    return { state, spawned: [] };
  }

  const elapsedMs = state.elapsedMs + deltaMs;
  let gold = tickGold(state.gold, deltaMs);
  let queue = state.queue;
  let phase = state.phase;
  let waveBudget = state.waveBudget;
  let restRemainingMs = state.restRemainingMs;

  if (phase === "saving" && gold.gold >= waveBudget) {
    for (const unit of composeWave(waveBudget, elapsedMs, random)) {
      const spent = spendForUnit(gold, unit);
      if (!spent.spent) {
        break;
      }
      gold = spent.state;
      queue = enqueueUnit(queue, unit);
    }
    phase = "spawning";
  }

  let spawned: readonly UnitName[] = [];
  if (phase === "spawning") {
    const result = tickQueue(queue, deltaMs);
    queue = result.queue;
    spawned = result.spawned;

    if (queue.units.length === 0) {
      phase = "resting";
      restRemainingMs = rollRestDuration(random);
      waveBudget = rollWaveBudget(elapsedMs, random);
    }
  } else if (phase === "resting") {
    restRemainingMs -= deltaMs;
    if (restRemainingMs <= 0) {
      phase = "saving";
      restRemainingMs = 0;
    }
  }

  return {
    state: {
      gold,
      queue,
      phase,
      waveBudget,
      restRemainingMs,
      elapsedMs
    },
    spawned
  };
}
