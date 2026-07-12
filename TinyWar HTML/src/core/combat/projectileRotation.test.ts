import { describe, expect, it } from "vitest";
import { createProjectile } from "./projectileSystem";
import { PROJECTILE_ANGLE_OFFSET, projectileRotation } from "./projectileRotation";

// The harpoon art points up-right, i.e. a -45 degree tilt in screen space
// (x right, y down). Adding the sprite rotation must yield the flight angle.
const HARPOON_ART_TILT = -Math.PI / 4;

function firstFlightRotation(kind: Parameters<typeof createProjectile>[0]): number {
  // A short shot to the right; sample the rotation on the first tick.
  const projectile = createProjectile(kind, "Blue", 10, false, { x: 0, y: 0 }, { x: 120, y: 0 });
  const advanced = { ...projectile, traveled: 8, position: { x: 8, y: -12 } };
  const rotation = projectileRotation(advanced);
  if (rotation === undefined) {
    throw new Error(`${kind} reported no rotation while in flight`);
  }
  return rotation;
}

describe("projectileRotation", () => {
  it("cancels the harpoon's baked-in up-right tilt so it flies tip-first", () => {
    // A harpoon flying purely to the right (facing angle 0) must end up with
    // its drawn tip pointing right: rotation + art tilt === facing angle.
    const projectile = createProjectile("Harpoon", "Blue", 10, false, { x: 0, y: 0 }, { x: 200, y: 0 });
    // Force a horizontal facing by placing it mid-flight on the flat apex line.
    const flat = { ...projectile, traveled: 100, position: { x: 100, y: 0 } };
    // projectileFacing samples the arc; near the apex the vertical component is
    // tiny, so the drawn tip (rotation + tilt) must be close to horizontal.
    const rotation = projectileRotation(flat);
    expect(rotation).toBeDefined();
    const drawnTipAngle = rotation! + HARPOON_ART_TILT;
    expect(Math.abs(Math.sin(drawnTipAngle))).toBeLessThan(0.2);
    expect(Math.cos(drawnTipAngle)).toBeGreaterThan(0.8);
  });

  it("keeps the harpoon offset positive (art tilt is cancelled, not doubled)", () => {
    expect(PROJECTILE_ANGLE_OFFSET.Harpoon).toBeCloseTo(Math.PI / 4);
    expect(PROJECTILE_ANGLE_OFFSET.Arrow).toBe(0);
  });

  it("leaves the arrow art untouched (it already points right)", () => {
    // Climbing arrow: facing is up-right, and with no offset the sprite points
    // exactly along the flight direction.
    const rotation = firstFlightRotation("Arrow");
    expect(rotation).toBeLessThan(0); // up-right in screen space
  });
});
