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

// Pacing knobs for the wildnis mode. Monsters attack in distinct pulses with
// clear pauses; the troll is a rare, announced boss - never spammed.
export const MONSTER_BASE_WAVE_BUDGET = 110;
export const MONSTER_WAVE_BUDGET_VARIANCE = 70;
export const MONSTER_REST_MIN_MS = 8000;
export const MONSTER_REST_VARIANCE_MS = 6000;
export const MONSTER_ESCALATION_PER_MINUTE = 0.12;
export const MONSTER_MAX_ESCALATION = 3;
export const BEAR_UNLOCK_MS = 2 * 60000;
export const TROLL_INTERVAL_MS = 3 * 60000;
export const MAX_BEARS_PER_WAVE = 3;
/** Grace period before the forest stirs - the player builds a first line. */
export const INITIAL_GRACE_MS = 25000;

export type MonsterPhase = "saving" | "spawning" | "resting";

export interface MonsterDirectorState {
  readonly gold: GoldState;
  readonly queue: UnitQueue;
  readonly phase: MonsterPhase;
  readonly waveBudget: number;
  readonly restRemainingMs: number;
  readonly elapsedMs: number;
  readonly nextTrollAtMs: number;
}

export interface MonsterDirectorResult {
  state: MonsterDirectorState;
  spawned: readonly UnitName[];
  /** True on the tick a troll wave is queued - the scene announces it once. */
  trollWarning: boolean;
}

export function createMonsterDirector(incomeMultiplier = 1): MonsterDirectorState {
  return {
    gold: createGoldState(incomeMultiplier),
    queue: createQueue(),
    phase: "resting",
    waveBudget: MONSTER_BASE_WAVE_BUDGET,
    restRemainingMs: INITIAL_GRACE_MS,
    elapsedMs: 0,
    nextTrollAtMs: TROLL_INTERVAL_MS
  };
}

export function monsterEscalationFactor(elapsedMs: number): number {
  return Math.min(MONSTER_MAX_ESCALATION, 1 + (elapsedMs / 60000) * MONSTER_ESCALATION_PER_MINUTE);
}

export function rollMonsterWaveBudget(elapsedMs: number, random = Math.random): number {
  return Math.round(
    (MONSTER_BASE_WAVE_BUDGET + random() * MONSTER_WAVE_BUDGET_VARIANCE) * monsterEscalationFactor(elapsedMs)
  );
}

export function composeMonsterWave(
  budget: number,
  elapsedMs: number,
  includeTroll: boolean,
  random = Math.random
): readonly UnitName[] {
  const wave: UnitName[] = [];
  let remaining = budget;

  if (includeTroll) {
    // Exactly one troll leads a boss wave regardless of budget.
    wave.push("Troll");
  }

  const bearsUnlocked = elapsedMs >= BEAR_UNLOCK_MS;
  let bears = 0;
  while (
    bearsUnlocked &&
    wave.length < MAX_QUEUE_LENGTH &&
    bears < MAX_BEARS_PER_WAVE &&
    remaining >= UNIT_COSTS.Bear &&
    random() < 0.55
  ) {
    wave.push("Bear");
    remaining -= UNIT_COSTS.Bear;
    bears += 1;
  }

  while (wave.length < MAX_QUEUE_LENGTH && remaining >= UNIT_COSTS.Snake) {
    wave.push("Snake");
    remaining -= UNIT_COSTS.Snake;
  }

  if (wave.length === 0) {
    wave.push("Snake");
  }

  return wave;
}

export function tickMonsterDirector(
  state: MonsterDirectorState,
  deltaMs: number,
  random = Math.random
): MonsterDirectorResult {
  if (deltaMs <= 0) {
    return { state, spawned: [], trollWarning: false };
  }

  const elapsedMs = state.elapsedMs + deltaMs;
  let gold = tickGold(state.gold, deltaMs);
  let queue = state.queue;
  let phase = state.phase;
  let waveBudget = state.waveBudget;
  let restRemainingMs = state.restRemainingMs;
  let nextTrollAtMs = state.nextTrollAtMs;
  let trollWarning = false;

  if (phase === "saving" && gold.gold >= waveBudget) {
    const includeTroll = elapsedMs >= nextTrollAtMs;
    for (const unit of composeMonsterWave(waveBudget, elapsedMs, includeTroll, random)) {
      const spent = spendForUnit(gold, unit);
      // The troll is granted even when the budget cannot cover it - boss
      // waves are timed events, not economy purchases.
      gold = spent.spent ? spent.state : gold;
      queue = enqueueUnit(queue, unit);
    }
    if (includeTroll) {
      trollWarning = true;
      nextTrollAtMs = elapsedMs + TROLL_INTERVAL_MS;
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
      restRemainingMs = MONSTER_REST_MIN_MS + random() * MONSTER_REST_VARIANCE_MS;
      waveBudget = rollMonsterWaveBudget(elapsedMs, random);
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
      elapsedMs,
      nextTrollAtMs
    },
    spawned,
    trollWarning
  };
}
