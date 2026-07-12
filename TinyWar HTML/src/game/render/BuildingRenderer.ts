import Phaser from "phaser";
import {
  BUILDINGS,
  getBuildingRenderPosition,
  type BuildingInstance
} from "../../core/buildings/buildingData";
import { ASSETS } from "../../data/assetManifest";

const HEALTH_BAR_WIDTH_RATIO = 0.5;
const HEALTH_BAR_HEIGHT = 15;

export interface BuildingRenderHandle {
  sprite: Phaser.GameObjects.Image;
  healthFill: Phaser.GameObjects.Rectangle;
  healthFillMaxWidth: number;
  fires: Phaser.GameObjects.Sprite[];
  exploded: boolean;
}

/** Fires per damage fraction, matching the original's staging thresholds. */
function desiredFireCount(damage: number): number {
  if (damage > 0.75) return 8;
  if (damage > 0.5) return 5;
  if (damage > 0.25) return 3;
  if (damage > 0.05) return 1;
  return 0;
}

// Deterministic pseudo-random so a building's flames stay put across frames.
function hash(seed: string, index: number, salt: number): number {
  let h = salt | 0;
  const input = `${seed}:${index}`;
  for (let i = 0; i < input.length; i += 1) {
    h = (h * 31 + input.charCodeAt(i)) | 0;
  }
  h = (h ^ (h >> 13)) * 1274126177;
  return ((h ^ (h >> 16)) >>> 0) / 4294967296;
}

export class BuildingRenderer {
  constructor(private readonly scene: Phaser.Scene) {}

  render(buildings: readonly BuildingInstance[]): Map<string, BuildingRenderHandle> {
    const sprites = new Map<string, BuildingRenderHandle>();

    for (const building of buildings) {
      sprites.set(building.id, this.renderBuilding(building));
    }

    return sprites;
  }

  static updateHealth(handle: BuildingRenderHandle, building: BuildingInstance): void {
    handle.healthFill.width = handle.healthFillMaxWidth * (building.health / building.maxHealth);
    BuildingRenderer.syncFires(handle, building);
    if (building.health <= 0) {
      BuildingRenderer.explode(handle, building);
      handle.sprite.setAlpha(0.35);
      handle.healthFill.setAlpha(0.25);
    }
  }

  /** Grow (or, after repairs, shrink) the flame set to match the damage. */
  private static syncFires(handle: BuildingRenderHandle, building: BuildingInstance): void {
    const damage = 1 - building.health / building.maxHealth;
    const desired = building.health <= 0 ? 0 : desiredFireCount(damage);

    while (handle.fires.length > desired) {
      handle.fires.pop()?.destroy();
    }

    const scene = handle.sprite.scene;
    const width = handle.sprite.displayWidth;
    const height = handle.sprite.displayHeight;
    while (handle.fires.length < desired) {
      const index = handle.fires.length;
      const variant = ASSETS.effects.fires[Math.floor(hash(building.id, index, 1) * ASSETS.effects.fires.length)];
      const fire = scene.add
        .sprite(
          Math.round(handle.sprite.x + (hash(building.id, index, 2) - 0.5) * 0.6 * width),
          Math.round(handle.sprite.y + (hash(building.id, index, 3) - 0.5) * 0.4 * height),
          variant.key
        )
        .setDisplaySize(
          Math.round(40 * (0.7 + damage + hash(building.id, index, 4) * 0.2)),
          Math.round(40 * (0.7 + damage + hash(building.id, index, 4) * 0.2))
        )
        .setDepth(12);
      fire.play(variant.key);
      handle.fires.push(fire);
    }
  }

  /** One-shot explosion when the building goes down. */
  private static explode(handle: BuildingRenderHandle, building: BuildingInstance): void {
    if (handle.exploded) {
      return;
    }
    handle.exploded = true;

    const scene = handle.sprite.scene;
    const variant =
      ASSETS.effects.explosions[Math.floor(hash(building.id, 0, 5) * ASSETS.effects.explosions.length)];
    const explosion = scene.add
      .sprite(handle.sprite.x, handle.sprite.y, variant.key)
      .setDisplaySize(handle.sprite.displayWidth * 1.15, handle.sprite.displayWidth * 1.15)
      .setDepth(36);
    explosion.play(variant.key);
    explosion.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => explosion.destroy());
  }

  private renderBuilding(building: BuildingInstance): BuildingRenderHandle {
    const definition = BUILDINGS[building.name];
    const renderPosition = snapPosition(getBuildingRenderPosition(building));
    const renderWidth = snapSize(definition.size.width * definition.worldScale);
    const renderHeight = snapSize(definition.size.height * definition.worldScale);
    const sprite = this.scene.add.image(
      renderPosition.x,
      renderPosition.y,
      this.textureKey(building)
    );

    sprite.setOrigin(0.5, 0.5);
    sprite.setDisplaySize(renderWidth, renderHeight);
    sprite.setDepth(10);

    const barWidth = renderWidth * HEALTH_BAR_WIDTH_RATIO;
    const y = snap(renderPosition.y - renderHeight / 2 - 12);
    this.scene.add
      .rectangle(renderPosition.x, y, barWidth, HEALTH_BAR_HEIGHT, 0x000000, 0.75)
      .setDepth(20);
    const healthFillMaxWidth = barWidth - 4;
    const healthFill = this.scene.add
      .rectangle(
        renderPosition.x - barWidth / 2 + 2,
        y,
        healthFillMaxWidth * (building.health / building.maxHealth),
        HEALTH_BAR_HEIGHT - 4,
        0x32cd32,
        1
      )
      .setOrigin(0, 0.5)
      .setDepth(21);

    return {
      sprite,
      healthFill,
      healthFillMaxWidth,
      fires: [],
      exploded: false
    };
  }

  private textureKey(building: BuildingInstance): string {
    if (building.color === "Blue" && building.name === "Barracks") {
      return ASSETS.buildings.blueBarracks.key;
    }

    if (building.color === "Red" && building.name === "Barracks") {
      return ASSETS.buildings.redBarracks.key;
    }

    if (building.color === "Black" && building.name === "Castle") {
      return ASSETS.buildings.blackCastle.key;
    }

    if (building.color === "Blue" && building.name === "Tower") {
      return ASSETS.buildings.blueTower.key;
    }

    if (building.color === "Red" && building.name === "Tower") {
      return ASSETS.buildings.redTower.key;
    }

    throw new Error(`Missing building texture for ${building.color} ${building.name}`);
  }
}

function snap(value: number): number {
  return Math.round(value);
}

function snapSize(value: number): number {
  return Math.max(1, snap(value));
}

function snapPosition(position: { x: number; y: number }): { x: number; y: number } {
  return {
    x: snap(position.x),
    y: snap(position.y)
  };
}
