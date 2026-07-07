import Phaser from "phaser";
import { projectileFacing, type ProjectileInstance } from "../../core/combat/projectileSystem";
import { ASSETS } from "../../data/assetManifest";

export interface ProjectileRenderHandle {
  sprite: Phaser.GameObjects.Image;
}

export class ProjectileRenderer {
  constructor(private readonly scene: Phaser.Scene) {}

  renderProjectile(projectile: ProjectileInstance): ProjectileRenderHandle {
    const position = snapPosition(projectile.position);
    const sprite = this.scene.add.image(
      position.x,
      position.y,
      ASSETS.projectiles.arrow.key
    );
    sprite.setOrigin(0.5, 0.5);
    sprite.setScale(0.5);
    sprite.setDepth(35);
    this.updateSprite(sprite, projectile);

    return { sprite };
  }

  static updateHandle(handle: ProjectileRenderHandle, projectile: ProjectileInstance): void {
    const position = snapPosition(projectile.position);
    handle.sprite.setPosition(position.x, position.y);
    // Point the arrow along its actual arc velocity; once it has landed the
    // facing is undefined and the impact rotation is kept.
    const facing = projectileFacing(projectile);
    if (facing) {
      handle.sprite.setRotation(Math.atan2(facing.y, facing.x));
    }
  }

  static destroyHandle(handle: ProjectileRenderHandle): void {
    handle.sprite.destroy();
  }

  private updateSprite(sprite: Phaser.GameObjects.Image, projectile: ProjectileInstance): void {
    ProjectileRenderer.updateHandle({ sprite }, projectile);
  }
}

function snapPosition(position: { x: number; y: number }): { x: number; y: number } {
  return {
    x: Math.round(position.x),
    y: Math.round(position.y)
  };
}
