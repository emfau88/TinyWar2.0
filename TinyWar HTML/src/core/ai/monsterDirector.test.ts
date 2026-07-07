import { describe, expect, it } from "vitest";
import {
  BEAR_UNLOCK_MS,
  INITIAL_GRACE_MS,
  MAX_BEARS_PER_WAVE,
  TROLL_INTERVAL_MS,
  composeMonsterWave,
  createMonsterDirector,
  tickMonsterDirector,
  type MonsterDirectorState
} from "./monsterDirector";

const fixedRandom = (value: number) => () => value;

function tickUntil(
  state: MonsterDirectorState,
  predicate: (state: MonsterDirectorState) => boolean,
  stepMs = 500,
  maxSteps = 2000,
  random = fixedRandom(0.5)
): { state: MonsterDirectorState; spawned: string[]; warnings: number } {
  const spawned: string[] = [];
  let warnings = 0;
  for (let step = 0; step < maxSteps; step += 1) {
    if (predicate(state)) {
      return { state, spawned, warnings };
    }
    const result = tickMonsterDirector(state, stepMs, random);
    state = result.state;
    spawned.push(...result.spawned);
    if (result.trollWarning) {
      warnings += 1;
    }
  }
  return { state, spawned, warnings };
}

describe("monsterDirector", () => {
  it("grants a grace period before the first wave", () => {
    let state = createMonsterDirector();
    const spawned: string[] = [];
    for (let elapsed = 0; elapsed < INITIAL_GRACE_MS - 500; elapsed += 500) {
      const result = tickMonsterDirector(state, 500, fixedRandom(0.5));
      state = result.state;
      spawned.push(...result.spawned);
    }
    expect(spawned).toEqual([]);
  });

  it("sends snake-only waves before bears unlock", () => {
    const wave = composeMonsterWave(200, BEAR_UNLOCK_MS - 1, false, fixedRandom(0));
    expect(wave.length).toBeGreaterThan(0);
    expect(new Set(wave)).toEqual(new Set(["Snake"]));
  });

  it("mixes in a capped number of bears after the unlock", () => {
    const wave = composeMonsterWave(500, BEAR_UNLOCK_MS + 1, false, fixedRandom(0.4));
    const bears = wave.filter((unit) => unit === "Bear").length;
    expect(bears).toBeGreaterThan(0);
    expect(bears).toBeLessThanOrEqual(MAX_BEARS_PER_WAVE);
  });

  it("leads a boss wave with exactly one troll", () => {
    const wave = composeMonsterWave(300, TROLL_INTERVAL_MS, true, fixedRandom(0.4));
    expect(wave.filter((unit) => unit === "Troll").length).toBe(1);
    expect(wave[0]).toBe("Troll");
  });

  it("announces the troll exactly once per interval and respects the timer", () => {
    // Run for a bit more than one troll interval of game time.
    const totalMs = TROLL_INTERVAL_MS + 60000;
    let state = createMonsterDirector();
    let warnings = 0;
    const trolls: string[] = [];
    for (let elapsed = 0; elapsed < totalMs; elapsed += 500) {
      const result = tickMonsterDirector(state, 500, fixedRandom(0.5));
      state = result.state;
      if (result.trollWarning) {
        warnings += 1;
      }
      trolls.push(...result.spawned.filter((unit) => unit === "Troll"));
    }

    expect(warnings).toBe(1);
    expect(trolls.length).toBe(1);
    expect(state.nextTrollAtMs).toBeGreaterThan(TROLL_INTERVAL_MS);
  });

  it("rests between waves instead of streaming monsters continuously", () => {
    const spawning = tickUntil(createMonsterDirector(), (s) => s.phase === "spawning");
    const resting = tickUntil(spawning.state, (s) => s.phase === "resting");
    expect(resting.spawned.length).toBeGreaterThan(0);

    const duringRest = tickMonsterDirector(resting.state, 1000, fixedRandom(0.5));
    expect(duringRest.spawned).toEqual([]);
    expect(duringRest.state.queue.units.length).toBe(0);
  });
});
