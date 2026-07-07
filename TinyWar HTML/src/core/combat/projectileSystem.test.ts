import { describe, expect, it } from "vitest";
import {
  PROJECTILE_SPEED,
  createArrowProjectile,
  leadProjectileDestination,
  projectileFacing,
  updateProjectiles
} from "./projectileSystem";

describe("projectileFacing", () => {
  it("points along the arc: climbing at launch, diving before impact", () => {
    const arrow = createArrowProjectile("Blue", 10, false, { x: 0, y: 0 }, { x: 200, y: 0 });

    const early = updateProjectiles({ projectiles: [arrow], units: [], buildings: [] }, 100);
    const earlyFacing = projectileFacing(early.projectiles[0]);
    expect(earlyFacing).toBeDefined();
    expect(earlyFacing!.x).toBeGreaterThan(0);
    expect(earlyFacing!.y).toBeLessThan(0);

    const late = updateProjectiles(early, 1000);
    const lateFacing = projectileFacing(late.projectiles[0]);
    expect(lateFacing).toBeDefined();
    expect(lateFacing!.x).toBeGreaterThan(0);
    expect(lateFacing!.y).toBeGreaterThan(0);
  });

  it("returns undefined once the arrow has landed so the impact rotation sticks", () => {
    const arrow = createArrowProjectile("Blue", 10, false, { x: 0, y: 0 }, { x: 100, y: 0 });
    // 800ms at speed 160 covers 128 > 100 units, so the arrow lands but is
    // still within its two-second on-ground window.
    const landed = updateProjectiles({ projectiles: [arrow], units: [], buildings: [] }, 800);

    expect(landed.projectiles[0].traveled).toBe(landed.projectiles[0].totalDistance);
    expect(projectileFacing(landed.projectiles[0])).toBeUndefined();
  });
});

describe("leadProjectileDestination", () => {
  it("returns the current position for standing targets", () => {
    const target = { x: 100, y: 50 };
    expect(leadProjectileDestination({ x: 0, y: 0 }, target)).toEqual(target);
    expect(leadProjectileDestination({ x: 0, y: 0 }, target, { x: 0, y: 0 })).toEqual(target);
  });

  it("aims ahead of a moving target by roughly velocity times flight time", () => {
    const start = { x: 0, y: 0 };
    const target = { x: 160, y: 0 };
    const velocity = { x: 30, y: 0 };
    const predicted = leadProjectileDestination(start, target, velocity);

    const flightTime = 160 / PROJECTILE_SPEED;
    expect(predicted.x).toBeGreaterThan(target.x + velocity.x * flightTime * 0.9);
    expect(predicted.y).toBe(0);
  });

  it("hits a target that keeps moving at the predicted pace", () => {
    const start = { x: 0, y: 0 };
    let targetPosition = { x: 160, y: 0 };
    const velocity = { x: -30, y: 0 };
    const destination = leadProjectileDestination(start, targetPosition, velocity);
    const arrow = createArrowProjectile("Blue", 10, false, start, destination);

    let state = {
      projectiles: [arrow] as readonly typeof arrow[],
      units: [
        {
          ...unitStub("red-runner", targetPosition),
          velocity
        }
      ],
      buildings: []
    };

    const stepMs = 50;
    for (let elapsed = 0; elapsed < 3000 && state.projectiles.length > 0; elapsed += stepMs) {
      targetPosition = {
        x: targetPosition.x + (velocity.x * stepMs) / 1000,
        y: targetPosition.y
      };
      state = {
        ...updateProjectiles(
          {
            ...state,
            units: state.units.map((unit) => ({ ...unit, position: targetPosition }))
          },
          stepMs
        ),
        buildings: []
      } as typeof state;
    }

    const target = state.units.find((unit) => unit.id === "red-runner");
    expect(target?.health ?? 0).toBeLessThan(60);
  });
});

function unitStub(id: string, position: { x: number; y: number }) {
  return {
    id,
    name: "Archer" as const,
    color: "Red" as const,
    health: 60,
    maxHealth: 60,
    position,
    attackCooldownMs: 0,
    moving: true
  };
}
