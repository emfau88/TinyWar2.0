import { describe, expect, it } from "vitest";
import {
  BASE_INCOME_PER_SEC,
  STARTING_GOLD,
  UNIT_COSTS,
  canAfford,
  createGoldState,
  displayGold,
  spendForUnit,
  tickGold
} from "./goldEconomy";

describe("goldEconomy", () => {
  it("starts with the starting gold", () => {
    expect(createGoldState().gold).toBe(STARTING_GOLD);
  });

  it("accumulates income over time", () => {
    const state = tickGold(createGoldState(), 2000);
    expect(state.gold).toBeCloseTo(STARTING_GOLD + 2 * BASE_INCOME_PER_SEC);
  });

  it("scales income with the multiplier", () => {
    const state = tickGold(createGoldState(1.5), 1000);
    expect(state.gold).toBeCloseTo(STARTING_GOLD + 1.5 * BASE_INCOME_PER_SEC);
  });

  it("ignores zero and negative deltas", () => {
    const state = createGoldState();
    expect(tickGold(state, 0)).toBe(state);
    expect(tickGold(state, -50)).toBe(state);
  });

  it("spends gold when affordable and refuses when broke", () => {
    const rich = createGoldState();
    const spent = spendForUnit(rich, "Warrior");
    expect(spent.spent).toBe(true);
    expect(spent.state.gold).toBe(STARTING_GOLD - UNIT_COSTS.Warrior);

    const broke = { ...createGoldState(), gold: UNIT_COSTS.Priest - 1 };
    expect(canAfford(broke, "Priest")).toBe(false);
    const refused = spendForUnit(broke, "Priest");
    expect(refused.spent).toBe(false);
    expect(refused.state).toBe(broke);
  });

  it("floors gold for display", () => {
    expect(displayGold({ gold: 87.9, incomeMultiplier: 1 })).toBe(87);
  });

  it("sustains a slower pace than raw spawn durations", () => {
    // With income 10/s the cheapest unit takes 4.5s of income - the economy,
    // not the queue, must be the limiting factor for pacing.
    const cheapest = Math.min(...Object.values(UNIT_COSTS));
    expect(cheapest / BASE_INCOME_PER_SEC).toBeGreaterThan(4);
  });
});
