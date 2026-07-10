import Phaser from "phaser";
import { ASSETS } from "../../data/assetManifest";
import { BASIC_UNIT_ANIMATIONS } from "../../data/animationManifest";
import { allMapData } from "../../data/mapRegistry";

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
    this.load.image(ASSETS.icons.sound.key, ASSETS.icons.sound.path);
    this.load.image(ASSETS.icons.mute.key, ASSETS.icons.mute.path);
    this.load.image(ASSETS.buildings.blueBarracks.key, ASSETS.buildings.blueBarracks.path);
    this.load.image(ASSETS.buildings.redBarracks.key, ASSETS.buildings.redBarracks.path);
    this.load.image(ASSETS.buildings.blackCastle.key, ASSETS.buildings.blackCastle.path);
    this.load.image(ASSETS.units.blueWarrior.key, ASSETS.units.blueWarrior.path);
    this.load.image(ASSETS.units.blueLancer.key, ASSETS.units.blueLancer.path);
    this.load.image(ASSETS.units.blueArcher.key, ASSETS.units.blueArcher.path);
    this.load.image(ASSETS.units.bluePriest.key, ASSETS.units.bluePriest.path);
    this.load.image(ASSETS.units.redWarrior.key, ASSETS.units.redWarrior.path);
    this.load.image(ASSETS.units.redLancer.key, ASSETS.units.redLancer.path);
    this.load.image(ASSETS.units.redArcher.key, ASSETS.units.redArcher.path);
    this.load.image(ASSETS.units.redPriest.key, ASSETS.units.redPriest.path);
    this.load.image(ASSETS.projectiles.arrow.key, ASSETS.projectiles.arrow.path);
    this.load.image(ASSETS.projectiles.harpoon.key, ASSETS.projectiles.harpoon.path);
    this.load.spritesheet(ASSETS.projectiles.bone.key, ASSETS.projectiles.bone.path, {
      frameWidth: ASSETS.projectiles.bone.frameSize,
      frameHeight: ASSETS.projectiles.bone.frameSize
    });
    this.load.spritesheet(ASSETS.projectiles.magic.key, ASSETS.projectiles.magic.path, {
      frameWidth: ASSETS.projectiles.magic.frameSize,
      frameHeight: ASSETS.projectiles.magic.frameSize
    });
    for (const portrait of Object.values(ASSETS.monsterPortraits)) {
      this.load.image(portrait.key, portrait.path);
    }
    this.load.image(ASSETS.boostCards.frame.key, ASSETS.boostCards.frame.path);
    for (const art of Object.values(ASSETS.boostCards.art)) {
      this.load.image(art.key, art.path);
    }
    this.load.audio(ASSETS.audio.button.key, ASSETS.audio.button.path);
    this.load.audio(ASSETS.audio.click.key, ASSETS.audio.click.path);
    this.load.audio(ASSETS.audio.error.key, ASSETS.audio.error.path);
    this.load.audio(ASSETS.audio.explosion.key, ASSETS.audio.explosion.path);
    this.load.audio(ASSETS.audio.victory.key, ASSETS.audio.victory.path);
    this.load.audio(ASSETS.audio.defeat.key, ASSETS.audio.defeat.path);
    this.load.audio(ASSETS.audio.horn.key, ASSETS.audio.horn.path);
    this.load.audio(ASSETS.audio.message.key, ASSETS.audio.message.path);
    this.load.audio(ASSETS.audio.warning.key, ASSETS.audio.warning.path);

    for (const animation of BASIC_UNIT_ANIMATIONS) {
      this.load.spritesheet(animation.key, animation.path, {
        frameWidth: animation.frameWidth,
        frameHeight: animation.frameHeight
      });
    }

    const loadedTilesets = new Set<string>();
    for (const mapData of allMapData()) {
      for (const tileset of mapData.tilesets) {
        if (loadedTilesets.has(tileset.key)) {
          continue;
        }
        loadedTilesets.add(tileset.key);
        this.load.spritesheet(tileset.key, tileset.image, {
          frameWidth: tileset.tileWidth,
          frameHeight: tileset.tileHeight
        });
      }
    }
  }

  create(): void {
    for (const projectile of [ASSETS.projectiles.bone, ASSETS.projectiles.magic]) {
      if (!this.anims.exists(projectile.key)) {
        this.anims.create({
          key: projectile.key,
          frames: this.anims.generateFrameNumbers(projectile.key, {
            start: 0,
            end: projectile.frames - 1
          }),
          frameRate: 10,
          repeat: -1
        });
      }
    }

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

    this.scene.start("MenuScene");
  }
}
