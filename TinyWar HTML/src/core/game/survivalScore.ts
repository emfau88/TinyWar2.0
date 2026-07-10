// Survival scoring: how long the player held out and how many waves the
// forest sent. The best run is kept in localStorage (injectable for tests).

export interface SurvivalScore {
  timeMs: number;
  waves: number;
}

export interface ScoreStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

const BEST_SCORE_KEY = "tinywar-survival-best";

/** Longer survival wins; waves break ties. */
export function isBetterScore(score: SurvivalScore, best: SurvivalScore | undefined): boolean {
  if (!best) {
    return true;
  }
  if (score.timeMs !== best.timeMs) {
    return score.timeMs > best.timeMs;
  }
  return score.waves > best.waves;
}

/** "MM:SS" (or "H:MM:SS" past the hour) for HUD and end screen. */
export function formatSurvivalTime(timeMs: number): string {
  const totalSeconds = Math.floor(Math.max(0, timeMs) / 1000);
  const seconds = totalSeconds % 60;
  const minutes = Math.floor(totalSeconds / 60) % 60;
  const hours = Math.floor(totalSeconds / 3600);
  const mmss = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  return hours > 0 ? `${hours}:${mmss}` : mmss;
}

export function loadBestScore(storage?: ScoreStorage): SurvivalScore | undefined {
  const source = storage ?? defaultStorage();
  if (!source) {
    return undefined;
  }
  try {
    const raw = source.getItem(BEST_SCORE_KEY);
    if (!raw) {
      return undefined;
    }
    const parsed = JSON.parse(raw) as Partial<SurvivalScore>;
    if (typeof parsed.timeMs !== "number" || typeof parsed.waves !== "number") {
      return undefined;
    }
    return { timeMs: parsed.timeMs, waves: parsed.waves };
  } catch {
    return undefined;
  }
}

export function saveBestScore(score: SurvivalScore, storage?: ScoreStorage): void {
  const target = storage ?? defaultStorage();
  try {
    target?.setItem(BEST_SCORE_KEY, JSON.stringify(score));
  } catch {
    // Storage may be unavailable (private mode); losing the record is fine.
  }
}

/**
 * Compare the finished run against the stored best, persist the better one,
 * and report whether this run set a new record.
 */
export function recordRun(score: SurvivalScore, storage?: ScoreStorage): {
  newBest: boolean;
  best: SurvivalScore;
} {
  const previous = loadBestScore(storage);
  if (isBetterScore(score, previous)) {
    saveBestScore(score, storage);
    return { newBest: true, best: score };
  }
  return { newBest: false, best: previous as SurvivalScore };
}

function defaultStorage(): ScoreStorage | undefined {
  return typeof localStorage !== "undefined" ? localStorage : undefined;
}
