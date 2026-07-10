import { describe, expect, it } from "vitest";
import {
  formatSurvivalTime,
  isBetterScore,
  loadBestScore,
  recordRun,
  type ScoreStorage
} from "./survivalScore";

function fakeStorage(initial: Record<string, string> = {}): ScoreStorage {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => void data.set(key, value)
  };
}

describe("survivalScore", () => {
  it("formats times as MM:SS and hours when needed", () => {
    expect(formatSurvivalTime(0)).toBe("00:00");
    expect(formatSurvivalTime(65_000)).toBe("01:05");
    expect(formatSurvivalTime(14 * 60000 + 32000)).toBe("14:32");
    expect(formatSurvivalTime(3_600_000 + 61_000)).toBe("1:01:01");
  });

  it("prefers longer survival, then more waves", () => {
    expect(isBetterScore({ timeMs: 1000, waves: 1 }, undefined)).toBe(true);
    expect(isBetterScore({ timeMs: 2000, waves: 1 }, { timeMs: 1000, waves: 5 })).toBe(true);
    expect(isBetterScore({ timeMs: 1000, waves: 6 }, { timeMs: 1000, waves: 5 })).toBe(true);
    expect(isBetterScore({ timeMs: 999, waves: 9 }, { timeMs: 1000, waves: 1 })).toBe(false);
  });

  it("records a new best and keeps the old one otherwise", () => {
    const storage = fakeStorage();

    const first = recordRun({ timeMs: 60000, waves: 4 }, storage);
    expect(first.newBest).toBe(true);
    expect(loadBestScore(storage)).toEqual({ timeMs: 60000, waves: 4 });

    const worse = recordRun({ timeMs: 30000, waves: 2 }, storage);
    expect(worse.newBest).toBe(false);
    expect(worse.best).toEqual({ timeMs: 60000, waves: 4 });
    expect(loadBestScore(storage)).toEqual({ timeMs: 60000, waves: 4 });

    const better = recordRun({ timeMs: 90000, waves: 3 }, storage);
    expect(better.newBest).toBe(true);
    expect(loadBestScore(storage)).toEqual({ timeMs: 90000, waves: 3 });
  });

  it("survives corrupt storage contents", () => {
    expect(loadBestScore(fakeStorage({ "tinywar-survival-best": "not json" }))).toBeUndefined();
    expect(loadBestScore(fakeStorage({ "tinywar-survival-best": "{\"timeMs\":\"x\"}" }))).toBeUndefined();
  });
});
