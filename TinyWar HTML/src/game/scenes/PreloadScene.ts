import Phaser from "phaser";
import { ASSETS } from "../../data/assetManifest";
import { BASIC_UNIT_ANIMATIONS } from "../../data/animationManifest";
import { MAP_DATA } from "../../data/generated/mapData";

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super("PreloadScene");
  }

  preload(): void {
    this.load.image(ASSETS.background.cover.key, ASSETS.background.cover.path);
    this.load.image(ASSETS.background.scenery1.key, ASSETS.background.scenery1.path);
    this.load.image(ASSETS.ui.banner.key, ASSETS.ui.banner.path);
    this.load.spritesheet(ASSETS.ui.largeRibbons.key, ASSETS.ui.largeRibbons.path, {
      frameWidth: 64,
      frameHeight: 128
    });
    this.load.spritesheet(ASSETS.ui.smallRibbons.key, ASSETS.ui.smallRibbons.path, {
      frameWidth: 64,
      frameHeight: 64
    });
    this.load.spritesheet(ASSETS.ui.swords1.key, ASSETS.ui.swords1.path, {
      frameWidth: 105,
      frameHeight: 128
    });
    this.load.image(ASSETS.ui.swords2.key, ASSETS.ui.swords2.path);
    this.load.image(ASSETS.ui.swords3.key, ASSETS.ui.swords3.path);
    this.load.image(ASSETS.icons.anyArrow.key, ASSETS.icons.anyArrow.path);
    this.load.image(ASSETS.icons.topArrow.key, ASSETS.icons.topArrow.path);
    this.load.image(ASSETS.icons.topMidArrow.key, ASSETS.icons.topMidArrow.path);
    this.load.image(ASSETS.icons.midArrow.key, ASSETS.icons.midArrow.path);
    this.load.image(ASSETS.icons.topBotArrow.key, ASSETS.icons.topBotArrow.path);
    this.load.image(ASSETS.icons.attack.key, ASSETS.icons.attack.path);
    this.load.image(ASSETS.icons.guard.key, ASSETS.icons.guard.path);
    this.load.image(ASSETS.icons.march.key, ASSETS.icons.march.path);
    this.load.image(ASSETS.icons.berserk.key, ASSETS.icons.berserk.path);
    this.load.image(ASSETS.buildings.blueBarracks.key, ASSETS.buildings.blueBarracks.path);
    this.load.image(ASSETS.buildings.redBarracks.key, ASSETS.buildings.redBarracks.path);
    this.load.image(ASSETS.units.blueWarrior.key, ASSETS.units.blueWarrior.path);
    this.load.image(ASSETS.units.blueLancer.key, ASSETS.units.blueLancer.path);
    this.load.image(ASSETS.units.blueArcher.key, ASSETS.units.blueArcher.path);
    this.load.image(ASSETS.units.bluePriest.key, ASSETS.units.bluePriest.path);
    this.load.image(ASSETS.units.redWarrior.key, ASSETS.units.redWarrior.path);
    this.load.image(ASSETS.units.redLancer.key, ASSETS.units.redLancer.path);
    this.load.image(ASSETS.units.redArcher.key, ASSETS.units.redArcher.path);
    this.load.image(ASSETS.units.redPriest.key, ASSETS.units.redPriest.path);
    this.load.image(ASSETS.projectiles.arrow.key, ASSETS.projectiles.arrow.path);

    for (const animation of BASIC_UNIT_ANIMATIONS) {
      this.load.spritesheet(animation.key, animation.path, {
        frameWidth: animation.frameWidth,
        frameHeight: animation.frameHeight
      });
    }

    for (const tileset of MAP_DATA.tilesets) {
      this.load.spritesheet(tileset.key, tileset.image, {
        frameWidth: tileset.tileWidth,
        frameHeight: tileset.tileHeight
      });
    }
  }

  create(): void {
    for (const animation of BASIC_UNIT_ANIMATIONS) {
      if (this.anims.exists(animation.key)) {
        continue;
      }

      this.anims.create({
        key: animation.key,
        frames: this.anims.generateFrameNumbers(animation.key, {
          start: 0,
          end: animation.frames - 1
        }),
        frameRate: animation.frameRate,
        repeat: -1
      });
    }

    this.scene.start("GameScene");
  }
}
