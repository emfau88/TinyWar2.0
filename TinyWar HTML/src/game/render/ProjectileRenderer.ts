import Phaser from "phaser";
import {
  projectileFacing,
  type ProjectileInstance,
  type ProjectileKind
} from "../../core/combat/projectileSystem";
import { ASSETS } from "../../data/assetManifest";

export interface ProjectileRenderHandle {
  sprite: Phaser.GameObjects.Sprite;
}

const PROJECTILE_TEXTURES: Record<ProjectileKind, string> = {
  Arrow: ASSETS.projectiles.arrow.key,
  Bone: ASSETS.projectiles.bone.key,
  Magic: ASSETS.projectiles.magic.key,
  Harpoon: ASSETS.projectiles.harpoon.key
};

// The harpoon sprite art points diagonally, so its rotation needs the
// original's -45 degree offset to fly tip-first along the arc.
const PROJECTILE_ANGLE_OFFSET: Record<ProjectileKind, number> = {
  Arrow: 0,
  Bone: 0,
  Magic: 0,
  Harpoon: -Math.PI / 4
};

export class ProjectileRenderer {
  constructor(private readonly scene: Phaser.Scene) {}

  renderProjectile(projectile: ProjectileInstance): ProjectileRenderHandle {
    const position = snapPosition(projectile.position);
    const sprite = this.scene.add.sprite(
      position.x,
      position.y,
      PROJECTILE_TEXTURES[projectile.kind]
    );
    sprite.setOrigin(0.5, 0.5);
    sprite.setScale(0.5);
    sprite.setDepth(35);
    // Bone and magic sheets are animated (spin/pulse); their rotation stays
    // fixed at the original's 45 degree spawn angle instead of following the path.
    if (this.scene.anims.exists(PROJECTILE_TEXTURES[projectile.kind])) {
      sprite.play(PROJECTILE_TEXTURES[projectile.kind]);
      sprite.setRotation(Math.PI / 4);
    }
    ProjectileRenderer.updateHandle({ sprite }, projectile);

    return { sprite };
  }

  static updateHandle(handle: ProjectileRenderHandle, projectile: ProjectileInstance): void {
    const position = snapPosition(projectile.position);
    handle.sprite.setPosition(position.x, position.y);
    // Point the projectile along its actual arc velocity; straight projectiles
    // report no facing and keep their spawn rotation, and once a parabolic one
    // has landed the impact rotation is kept.
    const facing = projectileFacing(projectile);
    if (facing) {
      handle.sprite.setRotation(
        Math.atan2(facing.y, facing.x) + PROJECTILE_ANGLE_OFFSET[projectile.kind]
      );
    }
  }

  static destroyHandle(handle: ProjectileRenderHandle): void {
    handle.sprite.destroy();
  }
}

function snapPosition(position: { x: number; y: number }): { x: number; y: number } {
  return {
    x: Math.round(position.x),
    y: Math.round(position.y)
  };
}
