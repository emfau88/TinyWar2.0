import { describe, expect, it } from "vitest";
import {
  createStrategyState,
  selectStrategy,
  strategyHotkey,
  tickStrategyCooldown
} from "./playerStrategy";

describe("playerStrategy", () => {
  it("starts on Attack with the original cooldown already finished", () => {
    expect(createStrategyState()).toEqual({
      current: "Attack",
      remainingCooldownMs: 0
    });
  });

  it("switches strategy and starts the original 5s cooldown", () => {
    const result = selectStrategy(createStrategyState(), "Guard");

    expect(result.changed).toBe(true);
    expect(result.state).toEqual({
      current: "Guard",
      remainingCooldownMs: 5000
    });
  });

  it("blocks strategy changes while cooldown is running", () => {
    const first = selectStrategy(createStrategyState(), "March");
    const second = selectStrategy(first.state, "Berserk");

    expect(second.changed).toBe(false);
    expect(second.state.current).toBe("March");
  });

  it("ticks cooldown down to ready", () => {
    const selected = selectStrategy(createStrategyState(), "Berserk").state;
    const half = tickStrategyCooldown(selected, 2750);
    const done = tickStrategyCooldown(half, 3000);

    expect(half.remainingCooldownMs).toBe(2250);
    expect(done.remainingCooldownMs).toBe(0);
  });

  it("keeps original strategy hotkeys", () => {
    expect(strategyHotkey("Attack")).toBe("T");
    expect(strategyHotkey("Guard")).toBe("Y");
    expect(strategyHotkey("March")).toBe("U");
    expect(strategyHotkey("Berserk")).toBe("I");
  });
});
