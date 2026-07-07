import Phaser from "phaser";
import type { MapId } from "../../core/map/mapDefinition";
import { ASSETS } from "../../data/assetManifest";

interface ModeButton {
  panel: Phaser.GameObjects.Rectangle;
  label: Phaser.GameObjects.Text;
  subtitle: Phaser.GameObjects.Text;
}

export class MenuScene extends Phaser.Scene {
  private cover?: Phaser.GameObjects.Image;
  private classicButton?: ModeButton;
  private wildnisButton?: ModeButton;

  constructor() {
    super("MenuScene");
  }

  create(): void {
    // Dev shortcut: ?mode=classic|wildnis skips the menu (useful for testing).
    const requestedMode = new URLSearchParams(window.location.search).get("mode");
    if (requestedMode === "classic" || requestedMode === "wildnis") {
      this.startGame(requestedMode);
      return;
    }

    this.cover = this.add.image(0, 0, ASSETS.background.cover.key);

    this.classicButton = this.createModeButton(
      "Classic",
      "3 Lanes - Duel vs AI",
      0x1d4ed8,
      () => this.startGame("classic")
    );
    this.wildnisButton = this.createModeButton(
      "Wildnis",
      "1 Path - Monster Hunt",
      0x14532d,
      () => this.startGame("wildnis")
    );

    this.input.keyboard?.on("keydown-ENTER", () => this.startGame("classic"));

    this.layout(this.scale.width, this.scale.height);
    this.scale.off("resize", this.onResize, this);
    this.scale.on("resize", this.onResize, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off("resize", this.onResize, this);
    });
  }

  private createModeButton(
    title: string,
    subtitleText: string,
    color: number,
    onSelect: () => void
  ): ModeButton {
    const panel = this.add
      .rectangle(0, 0, 250, 72, color, 0.88)
      .setStrokeStyle(2, 0xf8fafc, 0.75)
      .setInteractive({ useHandCursor: true });
    panel.on("pointerdown", onSelect);

    const label = this.add
      .text(0, 0, title, {
        fontFamily: "TinyWar Fira Sans",
        fontSize: "26px",
        color: "#f8fafc"
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    label.on("pointerdown", onSelect);

    const subtitle = this.add
      .text(0, 0, subtitleText, {
        fontFamily: "TinyWar Fira Sans",
        fontSize: "13px",
        color: "#e2e8f0"
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    subtitle.on("pointerdown", onSelect);

    return { panel, label, subtitle };
  }

  private onResize(gameSize: Phaser.Structs.Size): void {
    this.layout(gameSize.width, gameSize.height);
  }

  private layout(width: number, height: number): void {
    this.cameras.main.setSize(width, height);

    if (this.cover) {
      const scale = Math.max(width / this.cover.width, height / this.cover.height);
      this.cover.setScale(scale).setPosition(width / 2, height / 2);
    }

    this.layoutModeButton(this.classicButton, width / 2, height * 0.56);
    this.layoutModeButton(this.wildnisButton, width / 2, height * 0.56 + 90);
  }

  private layoutModeButton(button: ModeButton | undefined, x: number, y: number): void {
    if (!button) {
      return;
    }

    button.panel.setPosition(x, y);
    button.label.setPosition(x, y - 12);
    button.subtitle.setPosition(x, y + 18);
  }

  private startGame(mode: MapId): void {
    this.scene.start("GameScene", { mode });
  }
}
