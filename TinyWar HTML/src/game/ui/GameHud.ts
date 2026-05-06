import Phaser from "phaser";
import type { PlayerDirection } from "../../core/player/playerDirection";
import type { UnitQueue } from "../../core/queue/unitQueue";
import type { UnitName } from "../../core/units/unitData";

export interface GameHudCallbacks {
  onCycleDirection: () => void;
  onQueueUnit: (unit: UnitName) => void;
}

export class GameHud {
  private readonly directionText: Phaser.GameObjects.Text;
  private readonly queueText: Phaser.GameObjects.Text;
  private readonly winnerText: Phaser.GameObjects.Text;

  constructor(
    private readonly scene: Phaser.Scene,
    direction: PlayerDirection,
    queue: UnitQueue,
    callbacks: GameHudCallbacks
  ) {
    this.directionText = this.scene.add
      .text(12, 12, this.directionLabel(direction), {
        fontFamily: "TinyWar Fira Sans",
        fontSize: "14px",
        color: "#f8fafc",
        backgroundColor: "rgba(17, 24, 39, 0.58)",
        padding: { x: 7, y: 4 }
      })
      .setScrollFactor(0)
      .setDepth(100);

    this.queueText = this.scene.add
      .text(12, 42, this.queueLabel(queue), {
        fontFamily: "TinyWar Fira Sans",
        fontSize: "14px",
        color: "#f8fafc",
        backgroundColor: "rgba(17, 24, 39, 0.58)",
        padding: { x: 7, y: 4 }
      })
      .setScrollFactor(0)
      .setDepth(100);

    this.winnerText = this.scene.add
      .text(this.scene.scale.width / 2, 84, "", {
        fontFamily: "TinyWar Fira Sans",
        fontSize: "18px",
        color: "#f8fafc",
        backgroundColor: "rgba(127, 29, 29, 0.78)",
        padding: { x: 10, y: 6 }
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(100)
      .setVisible(false);

    this.bindKeyboard(callbacks);
    this.createQueueButtons(callbacks);
  }

  get isWinnerVisible(): boolean {
    return this.winnerText.visible;
  }

  updateDirection(direction: PlayerDirection): void {
    this.directionText.setText(this.directionLabel(direction));
  }

  updateQueue(queue: UnitQueue): void {
    this.queueText.setText(this.queueLabel(queue));
  }

  showWinner(winner: string): void {
    this.winnerText.setText(`${winner} wins`).setVisible(true);
  }

  private bindKeyboard(callbacks: GameHudCallbacks): void {
    this.scene.input.keyboard?.on("keydown-L", callbacks.onCycleDirection);
    this.scene.input.keyboard?.on("keydown-Z", () => callbacks.onQueueUnit("Warrior"));
    this.scene.input.keyboard?.on("keydown-X", () => callbacks.onQueueUnit("Lancer"));
    this.scene.input.keyboard?.on("keydown-C", () => callbacks.onQueueUnit("Archer"));
    this.scene.input.keyboard?.on("keydown-V", () => callbacks.onQueueUnit("Priest"));
  }

  private createQueueButtons(callbacks: GameHudCallbacks): void {
    const units: UnitName[] = ["Warrior", "Lancer", "Archer", "Priest"];
    const gap = 8;
    const buttonWidth = Math.min(108, Math.max(78, (this.scene.scale.width - 44) / 4));
    const buttonHeight = 34;
    const totalWidth = buttonWidth * units.length + gap * (units.length - 1);
    const startX = this.scene.scale.width / 2 - totalWidth / 2;
    const y = this.scene.scale.height - 24;

    units.forEach((unit, index) => {
      const x = startX + index * (buttonWidth + gap) + buttonWidth / 2;
      const rect = this.scene.add
        .rectangle(x, y, buttonWidth, buttonHeight, 0x111827, 0.72)
        .setStrokeStyle(1, 0xf8fafc, 0.45)
        .setScrollFactor(0)
        .setDepth(100)
        .setInteractive({ useHandCursor: true });
      rect.on("pointerdown", () => callbacks.onQueueUnit(unit));

      this.scene.add
        .text(x, y, unit, {
          fontFamily: "TinyWar Fira Sans",
          fontSize: "13px",
          color: "#f8fafc"
        })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(101);
    });
  }

  private directionLabel(direction: PlayerDirection): string {
    return `Lanes: ${direction}  |  L: cycle`;
  }

  private queueLabel(queue: UnitQueue): string {
    const queued = queue.units.map((item) => item.unit[0]).join(" ");
    return `Queue: ${queued || "-"}`;
  }
}
