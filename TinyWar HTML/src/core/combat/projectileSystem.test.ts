import { describe, expect, it } from "vitest";
import {
  PROJECTILE_SPEED,
  createProjectile,
  leadProjectileDestination,
  projectileFacing,
  projectileMode,
  unitProjectile,
  updateProjectiles
} from "./projectileSystem";

function createArrowProjectile(
  color: "Blue" | "Red",
  damage: number,
  sourceOnBuilding: boolean,
  start: { x: number; y: number },
  destination: { x: number; y: number }
) {
  return createProjectile("Arrow", color, damage, sourceOnBuilding, start, destination);
}

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

describe("projectile kinds", () => {
  it("maps ranged units to their original projectiles", () => {
    expect(unitProjectile("Archer")).toBe("Arrow");
    expect(unitProjectile("Gnoll")).toBe("Bone");
    expect(unitProjectile("Shaman")).toBe("Magic");
    expect(unitProjectile("Shark")).toBe("Harpoon");
    expect(unitProjectile("Warrior")).toBeUndefined();
    expect(unitProjectile("Goblin")).toBeUndefined();
  });

  it("flies bones and magic straight while arrows and harpoons arc", () => {
    expect(projectileMode("Bone")).toBe("straight");
    expect(projectileMode("Magic")).toBe("straight");
    expect(projectileMode("Arrow")).toBe("parabolic");
    expect(projectileMode("Harpoon")).toBe("parabolic");
  });

  it("moves straight projectiles linearly with a fixed facing", () => {
    const bone = createProjectile("Bone", "Red", 10, false, { x: 0, y: 0 }, { x: 200, y: 0 });
    const midway = updateProjectiles({ projectiles: [bone], units: [], buildings: [] }, 500);

    // 500ms at speed 160 covers 80 units - exactly on the start->target line.
    expect(midway.projectiles[0].position.x).toBeCloseTo(80, 5);
    expect(midway.projectiles[0].position.y).toBeCloseTo(0, 5);
    expect(projectileFacing(midway.projectiles[0])).toBeUndefined();
  });

  it("despawns straight projectiles on arrival instead of sticking in the ground", () => {
    const magic = createProjectile("Magic", "Red", 10, false, { x: 0, y: 0 }, { x: 100, y: 0 });
    const landed = updateProjectiles({ projectiles: [magic], units: [], buildings: [] }, 800);
    expect(landed.projectiles).toHaveLength(0);

    const arrow = createArrowProjectile("Red", 10, false, { x: 0, y: 0 }, { x: 100, y: 0 });
    const arrowLanded = updateProjectiles({ projectiles: [arrow], units: [], buildings: [] }, 800);
    expect(arrowLanded.projectiles).toHaveLength(1);
  });

  it("lets a harpoon arc and hit like an arrow", () => {
    const harpoon = createProjectile("Harpoon", "Blue", 10, false, { x: 0, y: 0 }, { x: 200, y: 0 });
    const early = updateProjectiles({ projectiles: [harpoon], units: [], buildings: [] }, 100);
    // Mid-flight a parabolic projectile is above the straight line.
    expect(early.projectiles[0].position.y).toBeLessThan(0);
    expect(projectileFacing(early.projectiles[0])).toBeDefined();

    const target = { ...unitStub("red-fish", { x: 200, y: 0 }) };
    let state = updateProjectiles({ projectiles: early.projectiles, units: [target], buildings: [] }, 50);
    for (let elapsed = 0; elapsed < 3000 && state.projectiles.length > 0; elapsed += 50) {
      state = updateProjectiles({ ...state, buildings: [] }, 50);
    }
    expect(state.units.find((unit) => unit.id === "red-fish")?.health ?? 0).toBeLessThan(60);
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
