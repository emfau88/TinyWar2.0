import Phaser from "phaser";
import { boostDefinition, type BoostName } from "../../core/boosts/boostData";
import type { BoostState } from "../../core/boosts/boostState";

const CARD_W = 150;
const CARD_H = 176;
const CARD_GAP = 14;
const PILL_H = 22;

interface CardHandle {
  container: Phaser.GameObjects.Container;
  bg: Phaser.GameObjects.Rectangle;
  title: Phaser.GameObjects.Text;
  desc: Phaser.GameObjects.Text;
  hint: Phaser.GameObjects.Text;
  name?: BoostName;
}

interface PillHandle {
  container: Phaser.GameObjects.Container;
  bg: Phaser.GameObjects.Rectangle;
  fill: Phaser.GameObjects.Rectangle;
  label: Phaser.GameObjects.Text;
  fillMax: number;
}

/**
 * Draft cards (shown when the game offers a choice) plus a compact active-boost
 * bar. The draft overlay is deliberately non-blocking: it dims the field but
 * the battle keeps running underneath, matching TinyWar's original pacing.
 */
export class BoostHud {
  private readonly backdrop: Phaser.GameObjects.Rectangle;
  private readonly heading: Phaser.GameObjects.Text;
  private readonly skip: Phaser.GameObjects.Text;
  private readonly cards: CardHandle[] = [];
  private readonly pills: PillHandle[] = [];
  private offerVisible = false;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly onChoose: (name: BoostName) => void,
    private readonly onSkip: () => void
  ) {
    this.backdrop = scene.add
      .rectangle(0, 0, scene.scale.width, scene.scale.height, 0x020617, 0.55)
      .setOrigin(0)
      .setScrollFactor(0)
      .setDepth(180)
      .setInteractive()
      .setVisible(false);

    this.heading = scene.add
      .text(0, 0, "Boost wählen", {
        fontFamily: "TinyWar Fira Sans",
        fontSize: "22px",
        color: "#f8fafc",
        stroke: "#020617",
        strokeThickness: 4
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(184)
      .setVisible(false);

    this.skip = scene.add
      .text(0, 0, "Überspringen", {
        fontFamily: "TinyWar Fira Sans",
        fontSize: "14px",
        color: "#cbd5f5",
        backgroundColor: "rgba(15,23,42,0.8)",
        padding: { x: 10, y: 5 }
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(184)
      .setInteractive({ useHandCursor: true })
      .setVisible(false);
    this.skip.on("pointerdown", () => this.onSkip());

    for (let i = 0; i < 3; i += 1) {
      this.cards.push(this.createCard());
    }
    for (let i = 0; i < 4; i += 1) {
      this.pills.push(this.createPill());
    }
  }

  private createCard(): CardHandle {
    const container = this.scene.add.container(0, 0).setScrollFactor(0).setDepth(183).setVisible(false);
    const bg = this.scene.add
      .rectangle(0, 0, CARD_W, CARD_H, 0x1f2937, 0.98)
      .setStrokeStyle(2, 0xfbbf24, 0.85)
      .setInteractive({ useHandCursor: true });
    const title = this.scene.add
      .text(0, -CARD_H / 2 + 26, "", {
        fontFamily: "TinyWar Fira Sans",
        fontSize: "17px",
        color: "#fbbf24",
        align: "center",
        wordWrap: { width: CARD_W - 20 }
      })
      .setOrigin(0.5, 0);
    const desc = this.scene.add
      .text(0, -6, "", {
        fontFamily: "TinyWar Fira Sans",
        fontSize: "12px",
        color: "#e2e8f0",
        align: "center",
        wordWrap: { width: CARD_W - 22 }
      })
      .setOrigin(0.5, 0.5);
    const hint = this.scene.add
      .text(0, CARD_H / 2 - 20, "Wählen", {
        fontFamily: "TinyWar Fira Sans",
        fontSize: "12px",
        color: "#94a3b8"
      })
      .setOrigin(0.5);
    container.add([bg, title, desc, hint]);
    bg.on("pointerdown", () => {
      const handle = this.cards.find((c) => c.bg === bg);
      if (handle?.name) {
        this.onChoose(handle.name);
      }
    });
    return { container, bg, title, desc, hint };
  }

  private createPill(): PillHandle {
    const container = this.scene.add.container(0, 0).setScrollFactor(0).setDepth(150).setVisible(false);
    const bg = this.scene.add.rectangle(0, 0, 118, PILL_H, 0x0f172a, 0.82).setOrigin(0, 0.5);
    const fill = this.scene.add
      .rectangle(2, PILL_H / 2 - 2, 114, 3, 0xfbbf24, 0.95)
      .setOrigin(0, 0.5);
    const label = this.scene.add
      .text(8, -1, "", {
        fontFamily: "TinyWar Fira Sans",
        fontSize: "12px",
        color: "#fef3c7"
      })
      .setOrigin(0, 0.5);
    container.add([bg, fill, label]);
    return { container, bg, fill, label, fillMax: 114 };
  }

  get objects(): Phaser.GameObjects.GameObject[] {
    return [
      this.backdrop,
      this.heading,
      this.skip,
      ...this.cards.map((c) => c.container),
      ...this.pills.map((p) => p.container)
    ];
  }

  get isOfferVisible(): boolean {
    return this.offerVisible;
  }

  update(state: BoostState, width: number, height: number): void {
    this.renderOffer(state, width, height);
    this.renderActive(state, width, height);
  }

  private renderOffer(state: BoostState, width: number, height: number): void {
    const offer = state.offer ?? [];
    this.offerVisible = offer.length > 0;

    this.backdrop.setVisible(this.offerVisible).setSize(width, height);
    this.heading.setVisible(this.offerVisible).setPosition(width / 2, height / 2 - CARD_H / 2 - 44);
    this.skip.setVisible(this.offerVisible).setPosition(width / 2, height / 2 + CARD_H / 2 + 30);

    const total = offer.length * CARD_W + (offer.length - 1) * CARD_GAP;
    const startX = width / 2 - total / 2 + CARD_W / 2;

    this.cards.forEach((card, index) => {
      const name = offer[index];
      if (!name) {
        card.container.setVisible(false);
        card.name = undefined;
        return;
      }
      const def = boostDefinition(name);
      card.name = name;
      card.title.setText(def.title);
      card.desc.setText(def.description);
      card.hint.setText(def.kind === "instant" ? "Sofort-Effekt" : `${def.durationMs / 1000}s aktiv`);
      card.container
        .setVisible(true)
        .setPosition(startX + index * (CARD_W + CARD_GAP), height / 2);
    });
  }

  private renderActive(state: BoostState, _width: number, height: number): void {
    const active = state.active;
    const baseY = height - 96;
    this.pills.forEach((pill, index) => {
      const boost = active[index];
      if (!boost) {
        pill.container.setVisible(false);
        return;
      }
      const def = boostDefinition(boost.name);
      const fraction = Phaser.Math.Clamp(boost.remainingMs / def.durationMs, 0, 1);
      pill.label.setText(def.title);
      pill.fill.width = pill.fillMax * fraction;
      pill.container.setVisible(true).setPosition(12, baseY - index * (PILL_H + 6));
    });
  }
}
