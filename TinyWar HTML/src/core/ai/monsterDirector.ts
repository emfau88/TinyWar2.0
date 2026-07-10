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

// Pacing knobs for the survival mode. Monsters attack in distinct pulses with
// clear pauses; bosses are rare, announced events - never spammed.
export const MONSTER_BASE_WAVE_BUDGET = 110;
export const MONSTER_WAVE_BUDGET_VARIANCE = 70;
export const MONSTER_REST_MIN_MS = 8000;
export const MONSTER_REST_VARIANCE_MS = 6000;
export const MONSTER_ESCALATION_PER_MINUTE = 0.12;
export const BOSS_INTERVAL_MS = 3 * 60000;
/** Grace period before the forest stirs - the player builds a first line. */
export const INITIAL_GRACE_MS = 25000;

// The bestiary unlocks in phases so the forest escalates from fodder swarms
// to ranged hunters over the course of a run.
export const PHASE_UNLOCKS: readonly { atMs: number; units: readonly UnitName[] }[] = [
  { atMs: 0, units: ["Snake", "Skull"] },
  { atMs: 2 * 60000, units: ["Spider", "Gnome", "Goblin"] },
  { atMs: 4 * 60000, units: ["Gnoll", "Bear", "Hammerhead"] },
  { atMs: 6 * 60000, units: ["Shaman", "Shark"] }
];
/** From this point on, a boss event can be a turtle wall instead. */
export const TANK_WALL_UNLOCK_MS = 8 * 60000;
export const TANK_WALL_CHANCE = 0.35;

export type WaveArchetype = "swarm" | "pack" | "hunt";
export type BossKind = "Troll" | "Minotaur" | "Wall";

// Which units a wave archetype leads with, and how many of them.
const ARCHETYPE_CORES: Record<WaveArchetype, { units: readonly UnitName[]; cap: number }> = {
  swarm: { units: ["Snake", "Skull", "Spider"], cap: MAX_QUEUE_LENGTH },
  pack: { units: ["Goblin", "Gnome", "Bear", "Hammerhead"], cap: 4 },
  hunt: { units: ["Gnoll", "Shaman", "Shark"], cap: 2 }
};
const FODDER_UNITS: readonly UnitName[] = ["Snake", "Skull", "Spider"];

export type MonsterPhase = "saving" | "spawning" | "resting";

export interface MonsterDirectorState {
  readonly gold: GoldState;
  readonly queue: UnitQueue;
  readonly phase: MonsterPhase;
  readonly waveBudget: number;
  readonly restRemainingMs: number;
  readonly elapsedMs: number;
  readonly nextBossAtMs: number;
  /** How many boss events have been queued - drives the Troll/Minotaur rotation. */
  readonly bossCount: number;
  /** How many waves have been sent - the survival score alongside elapsedMs. */
  readonly waveCount: number;
}

export interface MonsterDirectorResult {
  state: MonsterDirectorState;
  spawned: readonly UnitName[];
  /** True on the tick a boss wave is queued - the scene announces it once. */
  bossWarning: boolean;
}

export function createMonsterDirector(incomeMultiplier = 1): MonsterDirectorState {
  return {
    gold: createGoldState(incomeMultiplier),
    queue: createQueue(),
    phase: "resting",
    waveBudget: MONSTER_BASE_WAVE_BUDGET,
    restRemainingMs: INITIAL_GRACE_MS,
    elapsedMs: 0,
    nextBossAtMs: BOSS_INTERVAL_MS,
    bossCount: 0,
    waveCount: 0
  };
}

export function monsterEscalationFactor(elapsedMs: number): number {
  // Uncapped on purpose: survival keeps ramping until the defense breaks -
  // the run ends in a score, not a stalemate. Wave size stays bounded by the
  // queue limit; escalation shifts the budget toward heavier monsters.
  return 1 + (elapsedMs / 60000) * MONSTER_ESCALATION_PER_MINUTE;
}

export function rollMonsterWaveBudget(elapsedMs: number, random = Math.random): number {
  return Math.round(
    (MONSTER_BASE_WAVE_BUDGET + random() * MONSTER_WAVE_BUDGET_VARIANCE) * monsterEscalationFactor(elapsedMs)
  );
}

/** Every monster the forest may field at this point of the run. */
export function unlockedMonsters(elapsedMs: number): readonly UnitName[] {
  return PHASE_UNLOCKS.filter((phase) => elapsedMs >= phase.atMs).flatMap((phase) => phase.units);
}

/** The wave archetypes that have at least one unlocked core unit. */
export function availableArchetypes(elapsedMs: number): readonly WaveArchetype[] {
  const unlocked = new Set(unlockedMonsters(elapsedMs));
  return (Object.keys(ARCHETYPE_CORES) as WaveArchetype[]).filter((archetype) =>
    ARCHETYPE_CORES[archetype].units.some((unit) => unlocked.has(unit))
  );
}

/** The boss the next boss event leads with: trolls and minotaurs alternate. */
export function rollBoss(bossCount: number, elapsedMs: number, random = Math.random): BossKind {
  if (elapsedMs >= TANK_WALL_UNLOCK_MS && random() < TANK_WALL_CHANCE) {
    return "Wall";
  }
  return bossCount % 2 === 0 ? "Troll" : "Minotaur";
}

function pick<T>(items: readonly T[], random: () => number): T {
  return items[Math.min(items.length - 1, Math.floor(random() * items.length))];
}

export function composeMonsterWave(
  budget: number,
  elapsedMs: number,
  boss: BossKind | null,
  random = Math.random
): readonly UnitName[] {
  const wave: UnitName[] = [];
  let remaining = budget;
  const unlocked = new Set(unlockedMonsters(elapsedMs));

  // Boss units lead their wave regardless of budget - boss waves are timed
  // events, not economy purchases.
  if (boss === "Troll" || boss === "Minotaur") {
    wave.push(boss);
  } else if (boss === "Wall") {
    // A slow wall of two turtles with a skull escort.
    wave.push("Turtle", "Turtle");
    while (wave.length < MAX_QUEUE_LENGTH && remaining >= UNIT_COSTS.Skull) {
      wave.push("Skull");
      remaining -= UNIT_COSTS.Skull;
    }
    return wave;
  }

  const archetype = pick(availableArchetypes(elapsedMs), random);
  const core = ARCHETYPE_CORES[archetype];
  const affordableCore = () =>
    core.units.filter((unit) => unlocked.has(unit) && UNIT_COSTS[unit] <= remaining);

  let coreCount = 0;
  while (wave.length < MAX_QUEUE_LENGTH && coreCount < core.cap && affordableCore().length > 0) {
    const unit = pick(affordableCore(), random);
    wave.push(unit);
    remaining -= UNIT_COSTS[unit];
    coreCount += 1;
  }

  // Fill the rest of the budget with unlocked fodder so packs and hunting
  // parties always arrive with a screen of cheap bodies.
  const affordableFodder = () =>
    FODDER_UNITS.filter((unit) => unlocked.has(unit) && UNIT_COSTS[unit] <= remaining);
  while (wave.length < MAX_QUEUE_LENGTH && affordableFodder().length > 0) {
    const unit = pick(affordableFodder(), random);
    wave.push(unit);
    remaining -= UNIT_COSTS[unit];
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
    return { state, spawned: [], bossWarning: false };
  }

  const elapsedMs = state.elapsedMs + deltaMs;
  let gold = tickGold(state.gold, deltaMs);
  let queue = state.queue;
  let phase = state.phase;
  let waveBudget = state.waveBudget;
  let restRemainingMs = state.restRemainingMs;
  let nextBossAtMs = state.nextBossAtMs;
  let bossCount = state.bossCount;
  let waveCount = state.waveCount;
  let bossWarning = false;

  if (phase === "saving" && gold.gold >= waveBudget) {
    const boss = elapsedMs >= nextBossAtMs ? rollBoss(bossCount, elapsedMs, random) : null;
    for (const unit of composeMonsterWave(waveBudget, elapsedMs, boss, random)) {
      const spent = spendForUnit(gold, unit);
      // Boss units are granted even when the budget cannot cover them.
      gold = spent.spent ? spent.state : gold;
      queue = enqueueUnit(queue, unit);
    }
    if (boss) {
      bossWarning = true;
      bossCount += 1;
      nextBossAtMs = elapsedMs + BOSS_INTERVAL_MS;
    }
    waveCount += 1;
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
      nextBossAtMs,
      bossCount,
      waveCount
    },
    spawned,
    bossWarning
  };
}
