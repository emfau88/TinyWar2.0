import Phaser from "phaser";
import { UNITS, isMonsterUnit } from "../../core/units/unitData";
import type { UnitInstance } from "../../core/units/unitData";
import { ASSETS } from "../../data/assetManifest";
import { unitAnimationKey, type UnitAction } from "../../data/animationManifest";

export interface UnitRenderHandle {
  sprite: Phaser.GameObjects.Sprite;
  healthBack: Phaser.GameObjects.Rectangle;
  healthFill: Phaser.GameObjects.Rectangle;
  healthFillMaxWidth: number;
}

export class UnitRenderer {
  constructor(private readonly scene: Phaser.Scene) {}

  render(units: readonly UnitInstance[]): Map<string, UnitRenderHandle> {
    const sprites = new Map<string, UnitRenderHandle>();

    for (const unit of units) {
      const sprite = this.renderUnit(unit);
      sprites.set(unit.id, sprite);
    }

    return sprites;
  }

  renderUnit(unit: UnitInstance, action: UnitAction = "Idle"): UnitRenderHandle {
      const position = snapPosition(unit.position);
      const sprite = this.scene.add.sprite(position.x, position.y, this.textureKey(unit));
      sprite.setOrigin(0.5, 0.5);
      sprite.setDisplaySize(UNITS[unit.name].renderSize, UNITS[unit.name].renderSize);
      sprite.setDepth(30);
      if (unit.color !== "Blue") {
        sprite.setFlipX(true);
      }

      this.playAction(sprite, unit, action);

      const healthWidth = 46;
      // Anchor the bar to the unit's world size, not its sprite frame size -
      // sprite frames differ wildly (Lancer 320px art vs Warrior 192px) while
      // the actual character height is comparable.
      const healthY = snap(unit.position.y - UNITS[unit.name].worldSize * 0.52);
      const healthBack = this.scene.add
        .rectangle(position.x, healthY, healthWidth, 6, 0x000000, 0.7)
        .setDepth(40);
      const healthFill = this.scene.add
        .rectangle(
          snap(unit.position.x - healthWidth / 2 + 1),
          healthY,
          healthWidth - 2,
          4,
          0x32cd32,
          1
        )
        .setOrigin(0, 0.5)
        .setDepth(41);

      return {
        sprite,
        healthBack,
        healthFill,
        healthFillMaxWidth: healthWidth - 2
      };
  }

  static updateHandle(
    handle: UnitRenderHandle,
    unit: UnitInstance,
    action: UnitAction = "Idle",
    targetPosition?: { x: number; y: number }
  ): void {
    const position = snapPosition(unit.position);
    const y = snap(unit.position.y - UNITS[unit.name].worldSize * 0.52);
    handle.sprite.setPosition(position.x, position.y);
    handle.sprite.setDisplaySize(UNITS[unit.name].renderSize, UNITS[unit.name].renderSize);
    handle.healthBack.setPosition(position.x, y);
    handle.healthFill.setPosition(snap(unit.position.x - (handle.healthFillMaxWidth + 2) / 2 + 1), y);
    handle.healthFill.width = handle.healthFillMaxWidth * (unit.health / unit.maxHealth);
    UnitRenderer.playUnitAction(handle.sprite, unit, action);
    if (targetPosition) {
      handle.sprite.setFlipX(targetPosition.x < unit.position.x);
    }
  }

  static destroyHandle(handle: UnitRenderHandle): void {
    handle.sprite.destroy();
    handle.healthBack.destroy();
    handle.healthFill.destroy();
  }

  playAction(sprite: Phaser.GameObjects.Sprite, unit: UnitInstance, action: UnitAction): void {
    UnitRenderer.playUnitAction(sprite, unit, action);
  }

  static actionForUnit(unit: UnitInstance & { moving?: boolean; targetId?: string; guarding?: boolean }): UnitAction {
    if (unit.guarding) {
      return "Guard";
    }

    if (unit.targetId) {
      return unit.name === "Priest" ? "Heal" : "Attack";
    }

    return unit.moving ? "Run" : "Idle";
  }

  private static playUnitAction(
    sprite: Phaser.GameObjects.Sprite,
    unit: UnitInstance,
    action: UnitAction
  ): void {
    const key = unitAnimationKey(unit.color, unit.name, action);
    if (sprite.scene.anims.exists(key) && sprite.anims.currentAnim?.key !== key) {
      sprite.play(key);
    }
  }

  private textureKey(unit: UnitInstance): string {
    if (isMonsterUnit(unit.name)) {
      // Monsters use their idle spritesheet as the base texture.
      return unitAnimationKey(unit.color, unit.name, "Idle");
    }

    if (unit.color === "Blue" && unit.name === "Archer") {
      return ASSETS.units.blueArcher.key;
    }

    if (unit.color === "Red" && unit.name === "Archer") {
      return ASSETS.units.redArcher.key;
    }

    if (unit.color === "Red" && unit.name === "Warrior") {
      return ASSETS.units.redWarrior.key;
    }

    if (unit.color === "Red" && unit.name === "Lancer") {
      return ASSETS.units.redLancer.key;
    }

    if (unit.color === "Red" && unit.name === "Priest") {
      return ASSETS.units.redPriest.key;
    }

    if (unit.color === "Blue" && unit.name === "Warrior") {
      return ASSETS.units.blueWarrior.key;
    }

    if (unit.color === "Blue" && unit.name === "Lancer") {
      return ASSETS.units.blueLancer.key;
    }

    if (unit.color === "Blue" && unit.name === "Priest") {
      return ASSETS.units.bluePriest.key;
    }

    throw new Error(`Missing unit texture for ${unit.color} ${unit.name}`);
  }
}

function snap(value: number): number {
  return Math.round(value);
}

function snapPosition(position: { x: number; y: number }): { x: number; y: number } {
  return {
    x: snap(position.x),
    y: snap(position.y)
  };
}
