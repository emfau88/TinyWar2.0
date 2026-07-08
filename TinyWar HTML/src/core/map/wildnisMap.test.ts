import { afterEach, describe, expect, it } from "vitest";
import { createLaneUnit, updateMovingUnit } from "../movement/movementSystem";
import { setActiveMap } from "./activeMap";
import { tileToWorld } from "./mapGeometry";
import { CLASSIC_MAP } from "./mapDefinition";
import { getLanePath, isWalkable } from "./pathfinding";
import { WILDNIS_MAP } from "./wildnisMap";

afterEach(() => {
  setActiveMap(CLASSIC_MAP);
});

describe("wildnis map", () => {
  it("has a single lane", () => {
    expect(WILDNIS_MAP.availableLanes).toEqual(["Mid"]);
  });

  it("connects the player door to the lair door along walkable tiles", () => {
    setActiveMap(WILDNIS_MAP);
    const path = getLanePath("Mid");

    expect(path[0]).toEqual(WILDNIS_MAP.start);
    expect(path[path.length - 1]).toEqual(WILDNIS_MAP.end);
    for (const tile of path) {
      expect(isWalkable(tile)).toBe(true);
    }
  });

  it("winds through the forest instead of cutting straight", () => {
    setActiveMap(WILDNIS_MAP);
    const path = getLanePath("Mid");
    const direct =
      Math.abs(WILDNIS_MAP.end.x - WILDNIS_MAP.start.x) +
      Math.abs(WILDNIS_MAP.end.y - WILDNIS_MAP.start.y);

    // The landscape S-curve must stay a real detour over the direct distance.
    expect(path.length).toBeGreaterThan(direct * 1.25);
  });

  it("lets a monster walk the whole serpentine from the lair to the player's door", () => {
    setActiveMap(WILDNIS_MAP);
    const lairDoor = tileToWorld(WILDNIS_MAP.bases.opponent.door);
    const playerDoor = tileToWorld(WILDNIS_MAP.bases.player.door);
    let snake = createLaneUnit("Snake", "Mid", 0, "test", "Black", lairDoor, playerDoor);

    for (let step = 0; step < 30000 && snake.moving; step += 1) {
      snake = updateMovingUnit(snake, 0.05);
    }

    expect(snake.moving).toBe(false);
    const arrival = Math.hypot(snake.position.x - playerDoor.x, snake.position.y - playerDoor.y);
    expect(arrival).toBeLessThan(64);
  });

  it("lets a player unit walk from the base to the lair door", () => {
    setActiveMap(WILDNIS_MAP);
    const lairDoor = tileToWorld(WILDNIS_MAP.bases.opponent.door);
    const playerDoor = tileToWorld(WILDNIS_MAP.bases.player.door);
    let warrior = createLaneUnit("Warrior", "Mid", 0, "test", "Blue", playerDoor, lairDoor);

    for (let step = 0; step < 30000 && warrior.moving; step += 1) {
      warrior = updateMovingUnit(warrior, 0.05);
    }

    expect(warrior.moving).toBe(false);
    const arrival = Math.hypot(warrior.position.x - lairDoor.x, warrior.position.y - lairDoor.y);
    expect(arrival).toBeLessThan(64);
  });

  it("keeps base and lair door tiles on walkable ground", () => {
    setActiveMap(WILDNIS_MAP);
    expect(isWalkable(WILDNIS_MAP.bases.player.door)).toBe(true);
    expect(isWalkable(WILDNIS_MAP.bases.opponent.door)).toBe(true);
    expect(isWalkable(WILDNIS_MAP.bases.player.anchor)).toBe(true);
  });
});
