import { projectileFacing, type ProjectileInstance, type ProjectileKind } from "./projectileSystem";

// Each projectile sprite has a baked-in orientation; the offset rotates the
// facing direction so the drawn tip points along the flight path. The arrow,
// bone and magic art point straight right (no offset); the harpoon art points
// up-right (a -45 degree tilt in screen space), so +45 degrees cancels it.
export const PROJECTILE_ANGLE_OFFSET: Record<ProjectileKind, number> = {
  Arrow: 0,
  Bone: 0,
  Magic: 0,
  Harpoon: Math.PI / 4
};

/**
 * Sprite rotation (radians) that points a projectile tip-first along its
 * flight direction, or undefined when it should keep its current rotation
 * (straight projectiles and landed parabolic ones report no facing).
 */
export function projectileRotation(projectile: ProjectileInstance): number | undefined {
  const facing = projectileFacing(projectile);
  if (!facing) {
    return undefined;
  }
  return Math.atan2(facing.y, facing.x) + PROJECTILE_ANGLE_OFFSET[projectile.kind];
}
