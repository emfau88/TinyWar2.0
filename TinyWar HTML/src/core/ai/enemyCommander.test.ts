import { describe, expect, it } from "vitest";
import {
  BASE_WAVE_BUDGET,
  MAX_ESCALATION,
  composeWave,
  createEnemyCommander,
  escalationFactor,
  rollWaveBudget,
  tickEnemyCommander,
  type EnemyCommanderState
} from "./enemyCommander";
import { STARTING_GOLD, UNIT_COSTS } from "../economy/goldEconomy";

const fixedRandom = (value: number) => () => value;

function tickUntil(
  state: EnemyCommanderState,
  predicate: (state: EnemyCommanderState) => boolean,
  stepMs = 500,
  maxSteps = 500,
  random = fixedRandom(0.5)
): { state: EnemyCommanderState; spawned: string[]; steps: number } {
  const spawned: string[] = [];
  for (let step = 0; step < maxSteps; step += 1) {
    if (predicate(state)) {
      return { state, spawned, steps: step };
    }
    const result = tickEnemyCommander(state, stepMs, random);
    state = result.state;
    spawned.push(...result.spawned);
  }
  return { state, spawned, steps: maxSteps };
}

describe("enemyCommander", () => {
  it("starts saving and spawns nothing before the wave budget is reached", () => {
    let state = createEnemyCommander();
    // Starting gold is 120, budget 150: one second of income is not enough.
    const result = tickEnemyCommander(state, 1000, fixedRandom(0.5));
    expect(result.spawned).toEqual([]);
    expect(result.state.phase).toBe("saving");
    expect(result.state.queue.units.length).toBe(0);
  });

  it("composes and queues a wave once the budget is reached", () => {
    const { state } = tickUntil(createEnemyCommander(), (s) => s.phase === "spawning");
    expect(state.queue.units.length).toBeGreaterThan(0);
    expect(state.gold.gold).toBeLessThan(BASE_WAVE_BUDGET);
  });

  it("rests after the wave has fully spawned and does not queue during rest", () => {
    const spawning = tickUntil(createEnemyCommander(), (s) => s.phase === "spawning");
    const resting = tickUntil(spawning.state, (s) => s.phase === "resting");
    expect(resting.spawned.length).toBeGreaterThan(0);
    expect(resting.state.queue.units.length).toBe(0);

    const stillResting = tickEnemyCommander(resting.state, 1000, fixedRandom(0.5));
    expect(stillResting.state.queue.units.length).toBe(0);
    expect(stillResting.spawned).toEqual([]);
  });

  it("returns to saving after the rest period", () => {
    const resting = tickUntil(createEnemyCommander(), (s) => s.phase === "resting");
    const saving = tickUntil(resting.state, (s) => s.phase === "saving");
    expect(saving.state.phase).toBe("saving");
  });

  it("escalates wave budgets over game time up to a cap", () => {
    expect(escalationFactor(0)).toBe(1);
    expect(escalationFactor(60000)).toBeCloseTo(1.15);
    expect(escalationFactor(60 * 60000)).toBe(MAX_ESCALATION);
    expect(rollWaveBudget(60000, fixedRandom(0))).toBeGreaterThan(rollWaveBudget(0, fixedRandom(0)));
  });

  it("always leads a wave with a frontline unit and respects the priest cap", () => {
    for (const roll of [0, 0.25, 0.5, 0.75, 0.99]) {
      const wave = composeWave(400, fixedRandom(roll));
      expect(["Warrior", "Lancer"]).toContain(wave[0]);
      expect(wave.filter((unit) => unit === "Priest").length).toBeLessThanOrEqual(1);
      const cost = wave.reduce((sum, unit) => sum + UNIT_COSTS[unit], 0);
      expect(cost).toBeLessThanOrEqual(400);
    }
  });

  it("uses the same starting economy as the player", () => {
    expect(createEnemyCommander().gold.gold).toBe(STARTING_GOLD);
  });
});
