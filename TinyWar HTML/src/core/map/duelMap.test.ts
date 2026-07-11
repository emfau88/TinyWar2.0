import { afterEach, describe, expect, it } from "vitest";
import { createLaneUnit, updateMovingUnit } from "../movement/movementSystem";
import { setActiveMap } from "./activeMap";
import { tileToWorld } from "./mapGeometry";
import { CLASSIC_MAP } from "./mapDefinition";
import { getLanePath, isWalkable } from "./pathfinding";
import { DUEL_MAP } from "./duelMap";

afterEach(() => {
  setActiveMap(CLASSIC_MAP);
});

describe("duel map", () => {
  it("has a single lane and two barracks bases", () => {
    expect(DUEL_MAP.availableLanes).toEqual(["Mid"]);
    expect(DUEL_MAP.bases.player.building).toBe("Barracks");
    expect(DUEL_MAP.bases.opponent.building).toBe("Barracks");
    expect(DUEL_MAP.bases.opponent.color).toBe("Red");
  });

  it("connects the two doors along walkable tiles", () => {
    setActiveMap(DUEL_MAP);
    const path = getLanePath("Mid");

    expect(path[0]).toEqual(DUEL_MAP.start);
    expect(path[path.length - 1]).toEqual(DUEL_MAP.end);
    for (const tile of path) {
      expect(isWalkable(tile)).toBe(true);
    }
  });

  it("dips through the sunken arena instead of cutting straight across", () => {
    setActiveMap(DUEL_MAP);
    const path = getLanePath("Mid");

    // Both doors sit at y=3 on the plateaus; the lane must descend into the
    // sunken village arena (y >= 10) before climbing back up.
    const deepestY = Math.max(...path.map((tile) => tile.y));
    expect(deepestY).toBeGreaterThanOrEqual(10);
  });

  it("lets a red unit walk the whole lane to the player's door", () => {
    setActiveMap(DUEL_MAP);
    const opponentDoor = tileToWorld(DUEL_MAP.bases.opponent.door);
    const playerDoor = tileToWorld(DUEL_MAP.bases.player.door);
    let warrior = createLaneUnit("Warrior", "Mid", 0, "test", "Red", opponentDoor, playerDoor);

    for (let step = 0; step < 30000 && warrior.moving; step += 1) {
      warrior = updateMovingUnit(warrior, 0.05);
    }

    expect(warrior.moving).toBe(false);
    const arrival = Math.hypot(warrior.position.x - playerDoor.x, warrior.position.y - playerDoor.y);
    expect(arrival).toBeLessThan(64);
  }, 20000);

  it("lets a blue unit walk from the base to the opponent door", () => {
    setActiveMap(DUEL_MAP);
    const opponentDoor = tileToWorld(DUEL_MAP.bases.opponent.door);
    const playerDoor = tileToWorld(DUEL_MAP.bases.player.door);
    let warrior = createLaneUnit("Warrior", "Mid", 0, "test", "Blue", playerDoor, opponentDoor);

    for (let step = 0; step < 30000 && warrior.moving; step += 1) {
      warrior = updateMovingUnit(warrior, 0.05);
    }

    expect(warrior.moving).toBe(false);
    const arrival = Math.hypot(warrior.position.x - opponentDoor.x, warrior.position.y - opponentDoor.y);
    expect(arrival).toBeLessThan(64);
  }, 20000);

  it("walks stairs vertically instead of cutting across them", () => {
    setActiveMap(DUEL_MAP);
    const path = getLanePath("Mid");
    const stairCells = [...(DUEL_MAP.stairTops ?? []), ...(DUEL_MAP.stairWalls ?? [])];
    const isStair = (tile: { x: number; y: number }) =>
      stairCells.some((stair) => stair.x === tile.x && stair.y === tile.y);
    const isWall = (tile: { x: number; y: number }) =>
      (DUEL_MAP.stairWalls ?? []).some((stair) => stair.x === tile.x && stair.y === tile.y);

    // The lane must actually use a stair, and every step touching one is
    // never diagonal; wall-side cells connect strictly vertically.
    expect(path.some(isStair)).toBe(true);
    for (let index = 1; index < path.length; index += 1) {
      const from = path[index - 1];
      const to = path[index];
      if (isStair(from) || isStair(to)) {
        expect(Math.abs(from.x - to.x) + Math.abs(from.y - to.y), `${from.x},${from.y} -> ${to.x},${to.y}`).toBe(1);
      }
      if (isWall(from) || isWall(to)) {
        expect(from.x, `${from.x},${from.y} -> ${to.x},${to.y} must be vertical`).toBe(to.x);
      }
    }
  });

  it("keeps both door and anchor tiles on walkable ground", () => {
    setActiveMap(DUEL_MAP);
    expect(isWalkable(DUEL_MAP.bases.player.door)).toBe(true);
    expect(isWalkable(DUEL_MAP.bases.opponent.door)).toBe(true);
    expect(isWalkable(DUEL_MAP.bases.player.anchor)).toBe(true);
    expect(isWalkable(DUEL_MAP.bases.opponent.anchor)).toBe(true);
  });
});
