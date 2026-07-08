import { describe, expect, it } from "vitest";
import {
  BOOST_DRAFT_CHOICES,
  BOOST_DRAFT_INTERVAL_MS,
  MAX_ACTIVE_BOOSTS,
  createBoostState,
  hasActiveBoost,
  rollOffer,
  selectBoost,
  skipOffer,
  tickBoosts,
  type BoostState
} from "./boostState";
import { boostDefinition } from "./boostData";

const seq = (values: number[]) => {
  let i = 0;
  return () => values[i++ % values.length];
};

describe("boostState", () => {
  it("offers no draft before the interval elapses", () => {
    const state = tickBoosts(createBoostState(), BOOST_DRAFT_INTERVAL_MS - 1, () => 0);
    expect(state.offer).toBeNull();
  });

  it("offers three distinct boosts once the interval elapses", () => {
    const state = tickBoosts(createBoostState(), BOOST_DRAFT_INTERVAL_MS, () => 0.5);
    expect(state.offer).not.toBeNull();
    expect(state.offer).toHaveLength(BOOST_DRAFT_CHOICES);
    expect(new Set(state.offer)).toHaveLength(BOOST_DRAFT_CHOICES);
  });

  it("does not roll a second offer while one is still pending", () => {
    let state = tickBoosts(createBoostState(), BOOST_DRAFT_INTERVAL_MS, () => 0.5);
    const firstOffer = state.offer;
    state = tickBoosts(state, BOOST_DRAFT_INTERVAL_MS, () => 0.1);
    expect(state.offer).toEqual(firstOffer);
  });

  it("adds a timed boost to the active list and clears the offer", () => {
    let state = tickBoosts(createBoostState(), BOOST_DRAFT_INTERVAL_MS, () => 0.5);
    const pick = state.offer!.find((name) => boostDefinition(name).kind === "timed");
    // Ensure the offer contains a timed boost by forcing one if needed.
    const target = pick ?? "Warrior";
    state = { ...state, offer: [target] };
    const result = selectBoost(state, target);
    expect(result.instant).toBeNull();
    expect(result.state.offer).toBeNull();
    expect(hasActiveBoost(result.state, target)).toBe(true);
    expect(result.state.active[0].remainingMs).toBe(boostDefinition(target).durationMs);
  });

  it("reports instant boosts back instead of activating them", () => {
    const state: BoostState = { draftTimerMs: 0, offer: ["Repair"], active: [] };
    const result = selectBoost(state, "Repair");
    expect(result.instant).toBe("Repair");
    expect(result.state.active).toHaveLength(0);
    expect(result.state.offer).toBeNull();
  });

  it("expires timed boosts when their timer runs out", () => {
    let state: BoostState = { draftTimerMs: BOOST_DRAFT_INTERVAL_MS, offer: null, active: [] };
    state = { ...selectBoost({ ...state, offer: ["Run"] }, "Run").state };
    const runDuration = boostDefinition("Run").durationMs;
    expect(hasActiveBoost(state, "Run")).toBe(true);

    state = tickBoosts(state, runDuration - 1, () => 0.5);
    expect(hasActiveBoost(state, "Run")).toBe(true);
    state = tickBoosts(state, 2, () => 0.5);
    expect(hasActiveBoost(state, "Run")).toBe(false);
  });

  it("refreshes a duplicate timed boost instead of stacking it", () => {
    let state: BoostState = { draftTimerMs: 0, offer: ["Warrior"], active: [] };
    state = selectBoost(state, "Warrior").state;
    state = tickBoosts(state, 10000, () => 0.5);
    state = selectBoost({ ...state, offer: ["Warrior"] }, "Warrior").state;
    const warriors = state.active.filter((boost) => boost.name === "Warrior");
    expect(warriors).toHaveLength(1);
    expect(warriors[0].remainingMs).toBe(boostDefinition("Warrior").durationMs);
  });

  it("never exceeds the active boost cap, dropping the shortest remaining", () => {
    // Four active boosts with explicit remaining times; ArmorGain is lowest.
    const state: BoostState = {
      draftTimerMs: 0,
      offer: ["Run"],
      active: [
        { name: "Warrior", remainingMs: 30000 },
        { name: "Lancer", remainingMs: 20000 },
        { name: "Arrows", remainingMs: 15000 },
        { name: "ArmorGain", remainingMs: 5000 }
      ]
    };
    const next = selectBoost(state, "Run").state;

    expect(next.active).toHaveLength(MAX_ACTIVE_BOOSTS);
    // The shortest-remaining boost (ArmorGain) is evicted; the new one stays.
    expect(hasActiveBoost(next, "ArmorGain")).toBe(false);
    expect(hasActiveBoost(next, "Run")).toBe(true);
    expect(hasActiveBoost(next, "Warrior")).toBe(true);
  });

  it("excludes already-active timed boosts from a fresh offer", () => {
    const offer = rollOffer([{ name: "Warrior", remainingMs: 5000 }], seq([0, 0, 0, 0, 0]));
    expect(offer).not.toContain("Warrior");
  });

  it("skipOffer clears the offer and resets the timer", () => {
    const state: BoostState = { draftTimerMs: 0, offer: ["Repair", "Run"], active: [] };
    const skipped = skipOffer(state);
    expect(skipped.offer).toBeNull();
    expect(skipped.draftTimerMs).toBe(BOOST_DRAFT_INTERVAL_MS);
  });
});
