import { describe, expect, it } from "vitest";
import { getLanePath, isWalkable } from "./pathfinding";

describe("pathfinding", () => {
  it("matches original walkable starting tiles", () => {
    expect(isWalkable({ x: 3, y: 0 })).toBe(true);
    expect(isWalkable({ x: 27, y: 0 })).toBe(true);
    expect(isWalkable({ x: 0, y: 15 })).toBe(false);
  });

  it("builds a mid-lane path through the original waypoint", () => {
    const path = getLanePath("Mid");

    expect(path[0]).toEqual({ x: 3, y: 0 });
    expect(path).toContainEqual({ x: 14, y: 6 });
    expect(path[path.length - 1]).toEqual({ x: 27, y: 0 });
  });

  it("builds distinct top, mid, and bot lane paths", () => {
    expect(getLanePath("Top")).toContainEqual({ x: 14, y: 2 });
    expect(getLanePath("Mid")).toContainEqual({ x: 14, y: 6 });
    expect(getLanePath("Bot")).toContainEqual({ x: 14, y: 10 });
  });
});
