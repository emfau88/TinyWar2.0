import Phaser from "phaser";
import type { MapId } from "../../core/map/mapDefinition";
import { ASSETS } from "../../data/assetManifest";

interface ModeButton {
  banner: Phaser.GameObjects.Image;
  label: Phaser.GameObjects.Text;
  subtitle: Phaser.GameObjects.Text;
}

// The banner art is 899x856; stretched wider and flatter than its native
// proportions so the subtitle lines get comfortable room on the parchment.
const BANNER_HEIGHT = 128;
const BANNER_WIDTH = 216;
const BANNER_GAP = 44;

export class MenuScene extends Phaser.Scene {
  private cover?: Phaser.GameObjects.Image;
  private modeButtons: ModeButton[] = [];

  constructor() {
    super("MenuScene");
  }

  create(): void {
    // Dev shortcut: ?mode=classic|duel|wildnis skips the menu (useful for testing).
    const requestedMode = new URLSearchParams(window.location.search).get("mode");
    if (requestedMode === "classic" || requestedMode === "duel" || requestedMode === "wildnis") {
      this.startGame(requestedMode);
      return;
    }

    this.cover = this.add.image(0, 0, ASSETS.background.cover.key);

    this.modeButtons = [
      this.createModeButton("Classic", "3 Lanes - Duell vs KI", () => this.startGame("classic")),
      this.createModeButton("Duell", "1 Lane - eine Front", () => this.startGame("duel")),
      this.createModeButton("Survival", "Überlebe die Monsterflut", () => this.startGame("wildnis"))
    ];

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
    onSelect: () => void
  ): ModeButton {
    const banner = this.add
      .image(0, 0, ASSETS.ui.banner.key)
      .setDisplaySize(BANNER_WIDTH, BANNER_HEIGHT)
      .setInteractive({ useHandCursor: true });

    const label = this.add
      .text(0, 0, title, {
        fontFamily: "TinyWar Fira Sans",
        fontSize: "27px",
        fontStyle: "bold",
        color: "#3d2410"
      })
      .setOrigin(0.5);

    const subtitle = this.add
      .text(0, 0, subtitleText, {
        fontFamily: "TinyWar Fira Sans",
        fontSize: "13px",
        fontStyle: "bold",
        color: "#59391a"
      })
      .setOrigin(0.5);

    const button: ModeButton = { banner, label, subtitle };
    const parts: (Phaser.GameObjects.Image | Phaser.GameObjects.Text)[] = [banner, label, subtitle];
    for (const part of parts) {
      part.setInteractive({ useHandCursor: true });
      part.on("pointerdown", onSelect);
      part.on("pointerover", () => this.setButtonHover(button, true));
      part.on("pointerout", () => this.setButtonHover(button, false));
    }

    return button;
  }

  private buttonScale = 1;

  private setButtonHover(button: ModeButton, hovered: boolean): void {
    const scale = this.buttonScale * (hovered ? 1.06 : 1);
    button.banner.setDisplaySize(BANNER_WIDTH * scale, BANNER_HEIGHT * scale);
    button.label.setScale(scale);
    button.subtitle.setScale(scale);
    if (hovered) {
      button.banner.setTint(0xffe9b8);
    } else {
      button.banner.clearTint();
    }
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

    // The cover art's TinyWar shield sits around the vertical center; keep
    // the mode banners in the lower quarter so the title stays fully visible.
    // All banners always share one row: on narrow/short viewports (mobile
    // landscape) the whole row scales down instead of stacking off-screen.
    const count = this.modeButtons.length;
    const rowWidth = count * BANNER_WIDTH + (count - 1) * BANNER_GAP;
    this.buttonScale = Math.min(1, (width - 24) / rowWidth, (height * 0.3) / BANNER_HEIGHT);
    const scale = this.buttonScale;
    const bannerWidth = BANNER_WIDTH * scale;
    const gap = BANNER_GAP * scale;
    const y = Math.min(height * 0.78, height - (BANNER_HEIGHT * scale) / 2 - 12);
    const startX = width / 2 - (count * bannerWidth + (count - 1) * gap) / 2 + bannerWidth / 2;
    this.modeButtons.forEach((button, index) => {
      this.layoutModeButton(button, startX + index * (bannerWidth + gap), y, scale);
    });
  }

  private layoutModeButton(
    button: ModeButton | undefined,
    x: number,
    y: number,
    scale: number
  ): void {
    if (!button) {
      return;
    }

    button.banner.setDisplaySize(BANNER_WIDTH * scale, BANNER_HEIGHT * scale).setPosition(x, y);
    // The parchment area sits slightly above the banner's curled bottom edge.
    button.label.setScale(scale).setPosition(x, y - 16 * scale);
    button.subtitle.setScale(scale).setPosition(x, y + 12 * scale);
  }

  private startGame(mode: MapId): void {
    this.scene.start("GameScene", { mode });
  }
}
