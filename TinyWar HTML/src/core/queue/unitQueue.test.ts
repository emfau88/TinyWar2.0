import { describe, expect, it } from "vitest";
import { createQueue, enqueueUnit, MAX_QUEUE_LENGTH, tickQueue } from "./unitQueue";

describe("unitQueue", () => {
  it("queues units with their original spawn duration", () => {
    const queue = enqueueUnit(createQueue(), "Warrior");

    expect(queue.units).toEqual([{ unit: "Warrior", remainingMs: 2500 }]);
  });

  it("caps queue length at the original max", () => {
    let queue = createQueue();
    for (let index = 0; index < MAX_QUEUE_LENGTH + 2; index += 1) {
      queue = enqueueUnit(queue, "Lancer");
    }

    expect(queue.units).toHaveLength(MAX_QUEUE_LENGTH);
  });

  it("spawns the first unit when its timer finishes", () => {
    const queue = enqueueUnit(createQueue(), "Lancer");
    const result = tickQueue(queue, 1800);

    expect(result.spawned).toEqual(["Lancer"]);
    expect(result.queue.units).toHaveLength(0);
  });
});
