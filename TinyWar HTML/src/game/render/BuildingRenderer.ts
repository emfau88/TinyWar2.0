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
    if (building.health <= 0) {
      handle.sprite.setAlpha(0.35);
      handle.healthFill.setAlpha(0.25);
    }
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
      healthFillMaxWidth
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
