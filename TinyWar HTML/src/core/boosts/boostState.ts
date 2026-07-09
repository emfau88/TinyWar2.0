import {
  CORE_BOOST_NAMES,
  boostDefinition,
  isQueueBoost,
  isTimedBoost,
  queueBoostUnit,
  type BoostName
} from "./boostData";
import type { UnitName } from "../units/unitData";

export const BOOST_DRAFT_INTERVAL_MS = 30000;
export const BOOST_DRAFT_CHOICES = 3;
export const MAX_ACTIVE_BOOSTS = 4;

// Overridable so tests and dev builds can shorten the draft cadence.
let draftIntervalMs = BOOST_DRAFT_INTERVAL_MS;

export function setBoostDraftInterval(ms: number): void {
  draftIntervalMs = ms;
}

export function boostDraftInterval(): number {
  return draftIntervalMs;
}

export interface ActiveBoost {
  name: BoostName;
  remainingMs: number;
}

export interface BoostState {
  /** Countdown until the next draft is offered. */
  draftTimerMs: number;
  /** The boosts currently on offer, or null when no draft is pending. */
  offer: readonly BoostName[] | null;
  /** Timed boosts still ticking down. Instant boosts never live here. */
  active: readonly ActiveBoost[];
}

export function createBoostState(): BoostState {
  return {
    draftTimerMs: boostDraftInterval(),
    offer: null,
    active: []
  };
}

/**
 * Advance timers. Emits a fresh draft offer when the interval elapses (unless
 * one is already pending), and expires timed boosts that have run out.
 */
export function tickBoosts(
  state: BoostState,
  deltaMs: number,
  random: () => number = Math.random
): BoostState {
  if (deltaMs <= 0) {
    return state;
  }

  const active = state.active
    .map((boost) => ({ ...boost, remainingMs: boost.remainingMs - deltaMs }))
    .filter((boost) => boost.remainingMs > 0);

  let draftTimerMs = state.draftTimerMs;
  let offer = state.offer;

  if (offer === null) {
    draftTimerMs -= deltaMs;
    if (draftTimerMs <= 0) {
      offer = rollOffer(active, random);
      // Keep any overshoot so cadence stays stable across frames.
      draftTimerMs = boostDraftInterval() + draftTimerMs;
    }
  }

  return { draftTimerMs, offer, active };
}

/**
 * Pick BOOST_DRAFT_CHOICES boosts. Boosts that are already active as a timed
 * buff are excluded so an offer never wastes a slot on a running effect, and
 * while a queue boost runs no other queue boost is offered (original
 * condition: at most one queue unlock at a time).
 */
export function rollOffer(
  active: readonly ActiveBoost[],
  random: () => number = Math.random
): readonly BoostName[] {
  const activeTimed = new Set(active.map((boost) => boost.name));
  const queueBoostActive = active.some((boost) => isQueueBoost(boost.name));
  const pool = CORE_BOOST_NAMES.filter(
    (name) =>
      !(isTimedBoost(name) && activeTimed.has(name)) && !(queueBoostActive && isQueueBoost(name))
  );
  const shuffled = shuffle(pool, random);
  return shuffled.slice(0, Math.min(BOOST_DRAFT_CHOICES, shuffled.length));
}

/** The monster currently recruitable through an active queue boost, if any. */
export function activeQueueUnit(state: BoostState): UnitName | undefined {
  for (const boost of state.active) {
    const unit = queueBoostUnit(boost.name);
    if (unit) {
      return unit;
    }
  }
  return undefined;
}

export interface SelectResult {
  state: BoostState;
  /** True when an instant boost was chosen and should be applied by the caller. */
  instant: BoostName | null;
}

/**
 * Resolve the player's pick from the current offer. Timed boosts join the
 * active list (replacing/refreshing a duplicate); instant boosts are reported
 * back so the caller can apply their one-shot effect. Choosing clears the offer
 * and restarts the draft timer.
 */
export function selectBoost(state: BoostState, name: BoostName): SelectResult {
  if (!state.offer || !state.offer.includes(name)) {
    return { state, instant: null };
  }

  const clearedOffer: BoostState = {
    ...state,
    offer: null,
    draftTimerMs: boostDraftInterval()
  };

  if (!isTimedBoost(name)) {
    return { state: clearedOffer, instant: name };
  }

  const duration = boostDefinition(name).durationMs;
  const withoutDuplicate = clearedOffer.active.filter((boost) => boost.name !== name);
  const refreshed: ActiveBoost = { name, remainingMs: duration };

  // Respect the active cap; the freshly chosen boost always makes it in by
  // dropping the one with the least time left if we are already at the cap.
  let next = [...withoutDuplicate, refreshed];
  if (next.length > MAX_ACTIVE_BOOSTS) {
    next = [...next]
      .sort((a, b) => a.remainingMs - b.remainingMs)
      .slice(next.length - MAX_ACTIVE_BOOSTS);
  }

  return { state: { ...clearedOffer, active: next }, instant: null };
}

/** Dismiss the current offer without picking (restarts the draft timer). */
export function skipOffer(state: BoostState): BoostState {
  if (!state.offer) {
    return state;
  }
  return { ...state, offer: null, draftTimerMs: boostDraftInterval() };
}

export function hasActiveBoost(state: BoostState, name: BoostName): boolean {
  return state.active.some((boost) => boost.name === name);
}

function shuffle<T>(items: readonly T[], random: () => number): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
