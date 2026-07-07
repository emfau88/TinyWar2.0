import Phaser from "phaser";
import { ASSETS } from "../../data/assetManifest";

export class MenuScene extends Phaser.Scene {
  private cover?: Phaser.GameObjects.Image;
  private playPanel?: Phaser.GameObjects.Rectangle;
  private playLabel?: Phaser.GameObjects.Text;
  private hint?: Phaser.GameObjects.Text;

  constructor() {
    super("MenuScene");
  }

  create(): void {
    this.cover = this.add.image(0, 0, ASSETS.background.cover.key);

    this.playPanel = this.add
      .rectangle(0, 0, 220, 64, 0x111827, 0.85)
      .setStrokeStyle(2, 0xf8fafc, 0.7)
      .setInteractive({ useHandCursor: true });
    this.playPanel.on("pointerdown", () => this.startGame());

    this.playLabel = this.add
      .text(0, 0, "Play", {
        fontFamily: "TinyWar Fira Sans",
        fontSize: "28px",
        color: "#f8fafc"
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    this.playLabel.on("pointerdown", () => this.startGame());

    this.hint = this.add
      .text(0, 0, "Solo vs AI", {
        fontFamily: "TinyWar Fira Sans",
        fontSize: "16px",
        color: "#e2e8f0",
        backgroundColor: "rgba(17, 24, 39, 0.58)",
        padding: { x: 8, y: 4 }
      })
      .setOrigin(0.5);

    this.input.keyboard?.on("keydown-ENTER", () => this.startGame());
    this.input.keyboard?.on("keydown-SPACE", () => this.startGame());

    this.layout(this.scale.width, this.scale.height);
    this.scale.off("resize", this.onResize, this);
    this.scale.on("resize", this.onResize, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off("resize", this.onResize, this);
    });
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

    this.playPanel?.setPosition(width / 2, height * 0.62);
    this.playLabel?.setPosition(width / 2, height * 0.62);
    this.hint?.setPosition(width / 2, height * 0.62 + 56);
  }

  private startGame(): void {
    this.scene.start("GameScene");
  }
}
