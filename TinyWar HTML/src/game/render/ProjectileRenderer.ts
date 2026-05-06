import Phaser from "phaser";
import type { ProjectileInstance } from "../../core/combat/projectileSystem";
import { ASSETS } from "../../data/assetManifest";

export interface ProjectileRenderHandle {
  sprite: Phaser.GameObjects.Image;
}

export class ProjectileRenderer {
  constructor(private readonly scene: Phaser.Scene) {}

  renderProjectile(projectile: ProjectileInstance): ProjectileRenderHandle {
    const sprite = this.scene.add.image(
      projectile.position.x,
      projectile.position.y,
      ASSETS.projectiles.arrow.key
    );
    sprite.setOrigin(0.5, 0.5);
    sprite.setScale(0.5);
    sprite.setDepth(35);
    this.updateSprite(sprite, projectile);

    return { sprite };
  }

  static updateHandle(handle: ProjectileRenderHandle, projectile: ProjectileInstance): void {
    handle.sprite.setPosition(projectile.position.x, projectile.position.y);
    const dx = projectile.destination.x - projectile.position.x;
    const dy = projectile.destination.y - projectile.position.y;
    if (Math.hypot(dx, dy) > 0.01) {
      handle.sprite.setRotation(Math.atan2(dy, dx) + Math.PI / 4);
    }
  }

  static destroyHandle(handle: ProjectileRenderHandle): void {
    handle.sprite.destroy();
  }

  private updateSprite(sprite: Phaser.GameObjects.Image, projectile: ProjectileInstance): void {
    ProjectileRenderer.updateHandle({ sprite }, projectile);
  }
}
