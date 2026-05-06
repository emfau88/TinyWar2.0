import { describe, expect, it } from "vitest";
import { lanesForDirection, nextDirection, previousDirection } from "./playerDirection";

describe("playerDirection", () => {
  it("cycles in the original TinyWar order", () => {
    expect(nextDirection("Any")).toBe("Top");
    expect(nextDirection("Top")).toBe("TopMid");
    expect(nextDirection("TopMid")).toBe("Mid");
    expect(nextDirection("Mid")).toBe("MidBot");
    expect(nextDirection("MidBot")).toBe("Bot");
    expect(nextDirection("Bot")).toBe("TopBot");
    expect(nextDirection("TopBot")).toBe("Any");
  });

  it("cycles backwards in the original TinyWar order", () => {
    expect(previousDirection("Any")).toBe("TopBot");
    expect(previousDirection("Top")).toBe("Any");
  });

  it("maps directions to original lane selections", () => {
    expect(lanesForDirection("Any")).toEqual(["Top", "Mid", "Bot"]);
    expect(lanesForDirection("TopMid")).toEqual(["Top", "Mid"]);
    expect(lanesForDirection("MidBot")).toEqual(["Mid", "Bot"]);
    expect(lanesForDirection("TopBot")).toEqual(["Top", "Bot"]);
  });
});
