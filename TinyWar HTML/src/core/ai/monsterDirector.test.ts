import { describe, expect, it } from "vitest";
import {
  BOSS_INTERVAL_MS,
  INITIAL_GRACE_MS,
  PHASE_UNLOCKS,
  TANK_WALL_UNLOCK_MS,
  availableArchetypes,
  composeMonsterWave,
  createMonsterDirector,
  rollBoss,
  tickMonsterDirector,
  unlockedMonsters,
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
    if (result.bossWarning) {
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

  it("unlocks the bestiary in escalating phases", () => {
    expect(new Set(unlockedMonsters(0))).toEqual(new Set(["Snake", "Skull"]));
    expect(unlockedMonsters(PHASE_UNLOCKS[1].atMs)).toContain("Spider");
    expect(unlockedMonsters(PHASE_UNLOCKS[1].atMs)).not.toContain("Gnoll");
    expect(unlockedMonsters(PHASE_UNLOCKS[2].atMs)).toContain("Gnoll");
    expect(unlockedMonsters(PHASE_UNLOCKS[2].atMs)).not.toContain("Shaman");
    expect(unlockedMonsters(PHASE_UNLOCKS[3].atMs)).toContain("Shaman");
    expect(unlockedMonsters(PHASE_UNLOCKS[3].atMs)).toContain("Shark");
  });

  it("only offers archetypes whose core monsters are unlocked", () => {
    expect(availableArchetypes(0)).toEqual(["swarm"]);
    expect(availableArchetypes(PHASE_UNLOCKS[1].atMs)).toEqual(["swarm", "pack"]);
    expect(availableArchetypes(PHASE_UNLOCKS[2].atMs)).toEqual(["swarm", "pack", "hunt"]);
  });

  it("sends fodder-only waves in the opening phase", () => {
    const wave = composeMonsterWave(200, 0, null, fixedRandom(0));
    expect(wave.length).toBeGreaterThan(0);
    for (const unit of wave) {
      expect(["Snake", "Skull"]).toContain(unit);
    }
  });

  it("never fields monsters that are not unlocked yet", () => {
    for (const elapsed of [0, PHASE_UNLOCKS[1].atMs, PHASE_UNLOCKS[2].atMs]) {
      const unlocked = new Set(unlockedMonsters(elapsed));
      for (const roll of [0, 0.3, 0.6, 0.99]) {
        for (const unit of composeMonsterWave(400, elapsed, null, fixedRandom(roll))) {
          expect(unlocked.has(unit), `${unit} at ${elapsed}ms roll ${roll}`).toBe(true);
        }
      }
    }
  });

  it("caps hunting parties at two ranged monsters and escorts them with fodder", () => {
    // roll 0.99 keeps selecting the hunt archetype (last of the available three)
    // and the most expensive affordable core unit.
    const wave = composeMonsterWave(400, PHASE_UNLOCKS[3].atMs, null, fixedRandom(0.99));
    const ranged = wave.filter((unit) => ["Gnoll", "Shaman", "Shark"].includes(unit));
    expect(ranged.length).toBeGreaterThan(0);
    expect(ranged.length).toBeLessThanOrEqual(2);
    expect(wave.length).toBeGreaterThan(ranged.length);
  });

  it("alternates troll and minotaur bosses and unlocks the turtle wall late", () => {
    expect(rollBoss(0, 0, fixedRandom(0.99))).toBe("Troll");
    expect(rollBoss(1, 0, fixedRandom(0.99))).toBe("Minotaur");
    expect(rollBoss(2, 0, fixedRandom(0.99))).toBe("Troll");
    // Before the wall unlock the low roll still yields the rotation boss.
    expect(rollBoss(0, TANK_WALL_UNLOCK_MS - 1, fixedRandom(0))).toBe("Troll");
    expect(rollBoss(0, TANK_WALL_UNLOCK_MS, fixedRandom(0))).toBe("Wall");
  });

  it("leads a boss wave with exactly one boss monster", () => {
    const trollWave = composeMonsterWave(300, BOSS_INTERVAL_MS, "Troll", fixedRandom(0.4));
    expect(trollWave[0]).toBe("Troll");
    expect(trollWave.filter((unit) => unit === "Troll")).toHaveLength(1);

    const minotaurWave = composeMonsterWave(300, BOSS_INTERVAL_MS, "Minotaur", fixedRandom(0.4));
    expect(minotaurWave[0]).toBe("Minotaur");
    expect(minotaurWave.filter((unit) => unit === "Minotaur")).toHaveLength(1);
  });

  it("builds the turtle wall from two turtles and a skull escort", () => {
    const wave = composeMonsterWave(300, TANK_WALL_UNLOCK_MS, "Wall", fixedRandom(0.4));
    expect(wave.slice(0, 2)).toEqual(["Turtle", "Turtle"]);
    expect(new Set(wave.slice(2))).toEqual(new Set(["Skull"]));
  });

  it("announces the boss exactly once per interval and respects the timer", () => {
    // Run for a bit more than one boss interval of game time.
    const totalMs = BOSS_INTERVAL_MS + 60000;
    let state = createMonsterDirector();
    let warnings = 0;
    const bosses: string[] = [];
    for (let elapsed = 0; elapsed < totalMs; elapsed += 500) {
      const result = tickMonsterDirector(state, 500, fixedRandom(0.5));
      state = result.state;
      if (result.bossWarning) {
        warnings += 1;
      }
      bosses.push(...result.spawned.filter((unit) => unit === "Troll" || unit === "Minotaur"));
    }

    expect(warnings).toBe(1);
    expect(bosses).toEqual(["Troll"]);
    expect(state.nextBossAtMs).toBeGreaterThan(BOSS_INTERVAL_MS);
    expect(state.bossCount).toBe(1);
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
