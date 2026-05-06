import { describe, expect, it } from "vitest";
import { startingPositions, tileToWorld } from "./mapGeometry";

describe("mapGeometry", () => {
  it("converts original tile positions into Phaser top-left world positions", () => {
    expect(tileToWorld({ x: 3, y: 0 })).toEqual({ x: 224, y: 32 });
    expect(tileToWorld({ x: 27, y: 0 })).toEqual({ x: 1760, y: 32 });
  });

  it("uses original TinyWar starting tiles", () => {
    expect(startingPositions()).toEqual([
      { x: 224, y: 32 },
      { x: 1760, y: 32 }
    ]);
  });
});
