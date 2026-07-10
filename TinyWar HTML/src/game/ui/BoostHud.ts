import Phaser from "phaser";
import { boostDefinition, type BoostName } from "../../core/boosts/boostData";
import type { BoostState } from "../../core/boosts/boostState";
import { ASSETS } from "../../data/assetManifest";

// The original card frame (boost.png) is 342x565; keep its aspect ratio.
const CARD_W = 176;
const CARD_H = Math.round((CARD_W * 565) / 342);
const CARD_GAP = 20;
const PILL_H = 22;
// Artwork window and parchment area of the frame, as fractions of the card.
const ART_WIDTH = 0.8;
const ART_HEIGHT = 0.36;
const ART_CENTER_Y = -0.085;
// The parchment field of the frame spans roughly 0.155..0.39 of the card
// height below its center; keep title and description inside it.
const TEXT_TOP_Y = 0.155;

interface CardHandle {
  container: Phaser.GameObjects.Container;
  frame: Phaser.GameObjects.Image;
  art: Phaser.GameObjects.Image;
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
    // Artwork first so the frame's window overlaps its edges, like the original.
    const art = this.scene.add
      .image(0, CARD_H * ART_CENTER_Y, ASSETS.boostCards.frame.key)
      .setDisplaySize(CARD_W * ART_WIDTH, CARD_H * ART_HEIGHT);
    const frame = this.scene.add
      .image(0, 0, ASSETS.boostCards.frame.key)
      .setDisplaySize(CARD_W, CARD_H)
      .setInteractive({ useHandCursor: true });
    const title = this.scene.add
      .text(0, CARD_H * TEXT_TOP_Y, "", {
        fontFamily: "TinyWar Fira Sans",
        fontSize: "13px",
        color: "#78350f",
        align: "center",
        wordWrap: { width: CARD_W * 0.68 }
      })
      .setOrigin(0.5, 0);
    const desc = this.scene.add
      .text(0, CARD_H * TEXT_TOP_Y + 19, "", {
        fontFamily: "TinyWar Fira Sans",
        fontSize: "10px",
        color: "#1f2937",
        align: "center",
        lineSpacing: 1,
        wordWrap: { width: CARD_W * 0.66 }
      })
      .setOrigin(0.5, 0);
    // Duration badge in the artwork's lower-right corner.
    const hint = this.scene.add
      .text(CARD_W * (ART_WIDTH / 2), CARD_H * (ART_CENTER_Y + ART_HEIGHT / 2), "", {
        fontFamily: "TinyWar Fira Mono",
        fontSize: "11px",
        color: "#fef3c7",
        backgroundColor: "rgba(15,23,42,0.72)",
        padding: { x: 4, y: 1 }
      })
      .setOrigin(1, 1);
    container.add([art, frame, title, desc, hint]);
    frame.on("pointerdown", () => {
      const handle = this.cards.find((c) => c.frame === frame);
      if (handle?.name) {
        this.onChoose(handle.name);
      }
    });
    frame.on("pointerover", () => container.setScale(1.05));
    frame.on("pointerout", () => container.setScale(1));
    return { container, frame, art, title, desc, hint };
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
      card.art.setTexture(ASSETS.boostCards.art[name].key);
      card.art.setDisplaySize(CARD_W * ART_WIDTH, CARD_H * ART_HEIGHT);
      card.title.setText(def.title);
      card.desc.setText(def.description);
      card.hint.setText(def.kind === "instant" ? "Sofort" : `${def.durationMs / 1000}s`);
      card.container
        .setVisible(true)
        .setScale(1)
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
