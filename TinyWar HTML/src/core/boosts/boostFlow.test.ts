import { describe, expect, it } from "vitest";
import { createBuilding } from "../buildings/buildingData";
import { createUnit } from "../units/unitData";
import type { CombatUnit } from "../combat/combatSystem";
import {
  BOOST_DRAFT_INTERVAL_MS,
  createBoostState,
  selectBoost,
  tickBoosts
} from "./boostState";
import { applyRepair, applyInstantHealing } from "./instantBoosts";

// End-to-end flow at the core level: the draft appears on schedule, a pick
// activates/consumes correctly, and instant effects mutate world state. This
// mirrors what GameScene wires together, without needing Phaser.
describe("boost flow", () => {
  it("offers a draft after the interval and lets the player pick a timed buff", () => {
    let state = createBoostState();
    // Nothing before the interval.
    state = tickBoosts(state, BOOST_DRAFT_INTERVAL_MS - 100, () => 0.42);
    expect(state.offer).toBeNull();
    // Offer appears exactly at the interval.
    state = tickBoosts(state, 200, () => 0.42);
    expect(state.offer).not.toBeNull();

    // Force a known timed boost into the offer and pick it.
    const picked = selectBoost({ ...state, offer: ["Warrior"] }, "Warrior");
    expect(picked.instant).toBeNull();
    expect(picked.state.active.map((b) => b.name)).toContain("Warrior");
    expect(picked.state.offer).toBeNull();
  });

  it("applies an instant repair chosen from a draft to the world", () => {
    const damaged = { ...createBuilding("bb", "Barracks", "Blue", true, { x: 0, y: 0 }), health: 200 };
    const state = { ...createBoostState(), offer: ["Repair"] as const };

    const result = selectBoost(state, "Repair");
    expect(result.instant).toBe("Repair");

    const repaired = applyRepair([damaged], "Blue");
    expect(repaired[0].health).toBe(damaged.maxHealth);
  });

  it("heals the player's army when InstantHealing is drafted", () => {
    const hurt: CombatUnit = {
      ...createUnit("w", "Warrior", "Blue", { x: 0, y: 0 }),
      health: 20,
      attackCooldownMs: 0,
      moving: true
    };
    const state = { ...createBoostState(), offer: ["InstantHealing"] as const };
    const result = selectBoost(state, "InstantHealing");
    expect(result.instant).toBe("InstantHealing");

    const healed = applyInstantHealing([hurt], "Blue");
    expect(healed[0].health).toBe(hurt.maxHealth);
  });

  it("keeps a timed boost active for its full duration then drops it", () => {
    let state = selectBoost({ ...createBoostState(), offer: ["Run"] }, "Run").state;
    // Run lasts 15s; still active at 14.9s, gone shortly after 15s.
    state = tickBoosts(state, 14900, () => 0.5);
    expect(state.active.some((b) => b.name === "Run")).toBe(true);
    state = tickBoosts(state, 200, () => 0.5);
    expect(state.active.some((b) => b.name === "Run")).toBe(false);
  });
});
