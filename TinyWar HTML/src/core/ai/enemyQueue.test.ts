import { describe, expect, it } from "vitest";
import { chooseEnemyQueueUnit, createEnemyQueue, tickEnemyQueue } from "./enemyQueue";

describe("enemyQueue", () => {
  it("auto-queues a weighted random basic unit when empty", () => {
    const result = tickEnemyQueue(createEnemyQueue(), 0, () => 0);

    expect(result.state.queue.units[0].unit).toBe("Warrior");
  });

  it("spawns queued enemy units after their timer", () => {
    let result = tickEnemyQueue(createEnemyQueue(), 0, () => 0);
    result = tickEnemyQueue(result.state, 2500);

    expect(result.spawned).toEqual(["Warrior"]);
  });

  it("selects enemy units with inverse spawn-duration weights", () => {
    expect(chooseEnemyQueueUnit(() => 0)).toBe("Warrior");
    expect(chooseEnemyQueueUnit(() => 0.35)).toBe("Lancer");
    expect(chooseEnemyQueueUnit(() => 0.7)).toBe("Archer");
    expect(chooseEnemyQueueUnit(() => 0.95)).toBe("Priest");
  });
});
