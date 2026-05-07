import Phaser from "phaser";
import { PLAYER_STRATEGIES, strategyHotkey } from "../../core/player/playerStrategy";
import { UNITS as UNIT_DEFINITIONS } from "../../core/units/unitData";
import { ASSETS } from "../../data/assetManifest";
import type { PlayerDirection } from "../../core/player/playerDirection";
import type { PlayerStrategy, StrategyState } from "../../core/player/playerStrategy";
import type { UnitQueue } from "../../core/queue/unitQueue";
import type { UnitName } from "../../core/units/unitData";

const QUEUE_SLOT_COUNT = 10;
const BASIC_UNITS: UnitName[] = ["Warrior", "Lancer", "Archer", "Priest"];
const UNIT_ASSET_KEYS: Record<UnitName, string> = {
  Warrior: ASSETS.units.blueWarrior.key,
  Lancer: ASSETS.units.blueLancer.key,
  Archer: ASSETS.units.blueArcher.key,
  Priest: ASSETS.units.bluePriest.key
};
const STRATEGY_ASSET_KEYS: Record<PlayerStrategy, string> = {
  Attack: ASSETS.icons.attack.key,
  Guard: ASSETS.icons.guard.key,
  March: ASSETS.icons.march.key,
  Berserk: ASSETS.icons.berserk.key
};
const BLUE_RIBBON_INDEX = 0;
const RED_RIBBON_INDEX = 1;
const LARGE_RIBBON_FRAMES_PER_COLOR = 7;

export interface AdvanceBannerState {
  blueShare: number;
  redShare: number;
  bluePower: number;
  redPower: number;
  blueStrategy: PlayerStrategy;
  redStrategy: PlayerStrategy;
}

export interface GameHudCallbacks {
  onCycleDirection: () => void;
  onQueueUnit: (unit: UnitName) => void;
  onSelectStrategy: (strategy: PlayerStrategy) => void;
}

export class GameHud {
  private readonly blueAdvanceFill: Phaser.GameObjects.Image;
  private readonly redAdvanceFill: Phaser.GameObjects.Image;
  private readonly blueAdvanceText: Phaser.GameObjects.Text;
  private readonly redAdvanceText: Phaser.GameObjects.Text;
  private readonly blueAdvanceStrategyIcon: Phaser.GameObjects.Image;
  private readonly redAdvanceStrategyIcon: Phaser.GameObjects.Image;
  private readonly directionIcon: Phaser.GameObjects.Image;
  private readonly directionText: Phaser.GameObjects.Text;
  private readonly queueText: Phaser.GameObjects.Text;
  private readonly winnerText: Phaser.GameObjects.Text;
  private readonly queueIcons: Phaser.GameObjects.Image[] = [];
  private readonly queueProgressBackgrounds: Phaser.GameObjects.Rectangle[] = [];
  private readonly queueProgressBars: Phaser.GameObjects.Rectangle[] = [];
  private readonly strategyButtons = new Map<PlayerStrategy, Phaser.GameObjects.Rectangle>();
  private readonly strategyProgressBackgrounds = new Map<PlayerStrategy, Phaser.GameObjects.Rectangle>();
  private readonly strategyProgressBars = new Map<PlayerStrategy, Phaser.GameObjects.Rectangle>();

  constructor(
    private readonly scene: Phaser.Scene,
    direction: PlayerDirection,
    strategy: StrategyState,
    queue: UnitQueue,
    callbacks: GameHudCallbacks
  ) {
    const initialAdvance = {
      blueShare: 0.5,
      redShare: 0.5,
      bluePower: 0,
      redPower: 0,
      blueStrategy: strategy.current,
      redStrategy: "Attack" as const
    };
    const advance = this.createAdvanceBanner();
    this.blueAdvanceFill = advance.blueFill;
    this.redAdvanceFill = advance.redFill;
    this.blueAdvanceText = advance.blueText;
    this.redAdvanceText = advance.redText;
    this.blueAdvanceStrategyIcon = advance.blueStrategyIcon;
    this.redAdvanceStrategyIcon = advance.redStrategyIcon;
    this.updateAdvanceBanner(initialAdvance);

    this.scene.add
      .rectangle(34, 34, 48, 44, 0x111827, 0.62)
      .setStrokeStyle(1, 0xf8fafc, 0.42)
      .setScrollFactor(0)
      .setDepth(100)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", callbacks.onCycleDirection);

    this.directionIcon = this.scene.add
      .image(34, 34, this.directionIconKey(direction))
      .setDisplaySize(38, 38)
      .setFlipY(this.directionFlipsY(direction))
      .setScrollFactor(0)
      .setDepth(101)
      .setInteractive({ useHandCursor: true });
    this.directionIcon.on("pointerdown", callbacks.onCycleDirection);

    this.directionText = this.scene.add
      .text(66, 16, this.directionLabel(direction), {
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
    this.createShopButtons(callbacks);
    this.createStrategyButtons(callbacks);
    this.createQueueDisplay();
    this.updateStrategy(strategy);
    this.updateQueue(queue);
  }

  get isWinnerVisible(): boolean {
    return this.winnerText.visible;
  }

  updateDirection(direction: PlayerDirection): void {
    this.directionText.setText(this.directionLabel(direction));
    this.directionIcon.setTexture(this.directionIconKey(direction)).setFlipY(this.directionFlipsY(direction));
  }

  updateQueue(queue: UnitQueue): void {
    this.queueText.setText(this.queueLabel(queue));
    this.updateQueueDisplay(queue);
  }

  updateStrategy(strategy: StrategyState): void {
    const cooldownFraction = Phaser.Math.Clamp(strategy.remainingCooldownMs / 5000, 0, 1);

    for (const item of PLAYER_STRATEGIES) {
      const button = this.strategyButtons.get(item);
      const progressBg = this.strategyProgressBackgrounds.get(item);
      const progress = this.strategyProgressBars.get(item);
      if (!button || !progressBg || !progress) {
        continue;
      }

      const active = item === strategy.current;
      button.setStrokeStyle(active ? 2 : 1, active ? 0x4795a7 : 0xf8fafc, active ? 0.95 : 0.38);
      progressBg.setVisible(active && cooldownFraction > 0);
      progress.setVisible(active && cooldownFraction > 0);
      progress.displayWidth = Math.max(1, (progressBg.displayWidth - 4) * cooldownFraction);
    }
  }

  updateAdvanceBanner(state: AdvanceBannerState): void {
    const width = Math.min(this.scene.scale.width * 0.68, 560);
    const minHalfWidth = 42;
    const blueWidth = Math.max(minHalfWidth, width * Phaser.Math.Clamp(state.blueShare, 0.08, 0.92));
    const redWidth = Math.max(minHalfWidth, width - blueWidth);

    this.blueAdvanceFill.setDisplaySize(blueWidth, 44);
    this.redAdvanceFill.setDisplaySize(redWidth, 44);
    this.blueAdvanceFill.setX(this.scene.scale.width / 2 - redWidth / 2);
    this.redAdvanceFill.setX(this.scene.scale.width / 2 + blueWidth / 2);

    this.blueAdvanceText.setText(this.advanceLabel(state.blueShare, state.bluePower));
    this.redAdvanceText.setText(this.advanceLabel(state.redShare, state.redPower));
    this.blueAdvanceText.setX(this.scene.scale.width / 2 - width * 0.22);
    this.redAdvanceText.setX(this.scene.scale.width / 2 + width * 0.22);
    this.blueAdvanceStrategyIcon.setTexture(STRATEGY_ASSET_KEYS[state.blueStrategy]);
    this.redAdvanceStrategyIcon.setTexture(STRATEGY_ASSET_KEYS[state.redStrategy]);
    this.blueAdvanceStrategyIcon.setX(this.scene.scale.width / 2 - width * 0.39);
    this.redAdvanceStrategyIcon.setX(this.scene.scale.width / 2 + width * 0.39);
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
    this.scene.input.keyboard?.on("keydown-T", () => callbacks.onSelectStrategy("Attack"));
    this.scene.input.keyboard?.on("keydown-Y", () => callbacks.onSelectStrategy("Guard"));
    this.scene.input.keyboard?.on("keydown-U", () => callbacks.onSelectStrategy("March"));
    this.scene.input.keyboard?.on("keydown-I", () => callbacks.onSelectStrategy("Berserk"));
  }

  private createShopButtons(callbacks: GameHudCallbacks): void {
    const buttonSize = 44;
    const gap = 7;
    const totalHeight = BASIC_UNITS.length * buttonSize + (BASIC_UNITS.length - 1) * gap;
    const startY = this.scene.scale.height / 2 - totalHeight / 2;
    const x = 30;

    BASIC_UNITS.forEach((unit, index) => {
      const y = startY + index * (buttonSize + gap) + buttonSize / 2;
      const rect = this.scene.add
        .rectangle(x, y, buttonSize, buttonSize, 0x111827, 0.72)
        .setStrokeStyle(1, 0xf8fafc, 0.45)
        .setScrollFactor(0)
        .setDepth(100)
        .setInteractive({ useHandCursor: true });
      rect.on("pointerdown", () => callbacks.onQueueUnit(unit));

      this.scene.add
        .image(x, y - 2, UNIT_ASSET_KEYS[unit])
        .setDisplaySize(34, 34)
        .setScrollFactor(0)
        .setDepth(101);

      this.scene.add
        .text(x + 14, y + 12, this.hotkeyForUnit(unit), {
          fontFamily: "TinyWar Fira Sans",
          fontSize: "11px",
          color: "#f8fafc",
          backgroundColor: "rgba(15, 23, 42, 0.78)",
          padding: { x: 2, y: 0 }
        })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(102);
    });
  }

  private createQueueDisplay(): void {
    const width = Math.min(this.scene.scale.width * 0.86, 640);
    const slotWidth = width / (QUEUE_SLOT_COUNT + 2);
    const slotHeight = Math.min(58, Math.max(42, slotWidth * 1.18));
    const y = this.scene.scale.height - slotHeight / 2 - 8;
    const startX = this.scene.scale.width / 2 - width / 2;

    this.scene.add
      .image(startX + slotWidth / 2, y, ASSETS.ui.swords1.key, 0)
      .setDisplaySize(slotWidth, slotHeight)
      .setScrollFactor(0)
      .setDepth(98);

    for (let index = 0; index < QUEUE_SLOT_COUNT; index += 1) {
      const x = startX + slotWidth * (index + 1.5);
      this.scene.add
        .image(x, y, ASSETS.ui.swords2.key)
        .setDisplaySize(slotWidth, slotHeight)
        .setScrollFactor(0)
        .setDepth(98);

      const icon = this.scene.add
        .image(x, y - 3, ASSETS.units.blueWarrior.key)
        .setDisplaySize(slotHeight * 0.55, slotHeight * 0.55)
        .setScrollFactor(0)
        .setDepth(100)
        .setVisible(false);
      this.queueIcons.push(icon);

      const progressBg = this.scene.add
        .rectangle(x, y + slotHeight * 0.26, slotWidth * 0.62, 5, 0x020617, 0.82)
        .setScrollFactor(0)
        .setDepth(100)
        .setVisible(false);
      const progress = this.scene.add
        .rectangle(
          x - (slotWidth * 0.62) / 2,
          y + slotHeight * 0.26,
          slotWidth * 0.58,
          3,
          0x4795a7,
          0.95
        )
        .setOrigin(0, 0.5)
        .setScrollFactor(0)
        .setDepth(101)
        .setVisible(false);
      this.queueProgressBackgrounds.push(progressBg);
      this.queueProgressBars.push(progress);
    }

    this.scene.add
      .image(startX + slotWidth * (QUEUE_SLOT_COUNT + 1.5), y, ASSETS.ui.swords3.key)
      .setDisplaySize(slotWidth, slotHeight)
      .setScrollFactor(0)
      .setDepth(98);
  }

  private createAdvanceBanner(): {
    blueFill: Phaser.GameObjects.Image;
    redFill: Phaser.GameObjects.Image;
    blueText: Phaser.GameObjects.Text;
    redText: Phaser.GameObjects.Text;
    blueStrategyIcon: Phaser.GameObjects.Image;
    redStrategyIcon: Phaser.GameObjects.Image;
  } {
    const centerX = this.scene.scale.width / 2;
    const y = 31;
    const depth = 97;
    const blueFrame = BLUE_RIBBON_INDEX * LARGE_RIBBON_FRAMES_PER_COLOR + 3;
    const redFrame = RED_RIBBON_INDEX * LARGE_RIBBON_FRAMES_PER_COLOR + 3;

    const blueFill = this.scene.add
      .image(centerX - 140, y, ASSETS.ui.largeRibbons.key, blueFrame)
      .setDisplaySize(280, 44)
      .setScrollFactor(0)
      .setDepth(depth);
    const redFill = this.scene.add
      .image(centerX + 140, y, ASSETS.ui.largeRibbons.key, redFrame)
      .setDisplaySize(280, 44)
      .setFlipX(true)
      .setScrollFactor(0)
      .setDepth(depth);

    const blueStrategyIcon = this.scene.add
      .image(centerX - 220, y, STRATEGY_ASSET_KEYS.Attack)
      .setDisplaySize(25, 25)
      .setScrollFactor(0)
      .setDepth(depth + 2);
    const redStrategyIcon = this.scene.add
      .image(centerX + 220, y, STRATEGY_ASSET_KEYS.Attack)
      .setDisplaySize(25, 25)
      .setScrollFactor(0)
      .setDepth(depth + 2);

    const textStyle: Phaser.Types.GameObjects.Text.TextStyle = {
      fontFamily: "TinyWar Fira Sans",
      fontSize: "12px",
      color: "#0f172a",
      align: "center"
    };
    const blueText = this.scene.add
      .text(centerX - 120, y, "", textStyle)
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(depth + 2);
    const redText = this.scene.add
      .text(centerX + 120, y, "", textStyle)
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(depth + 2);

    return {
      blueFill,
      redFill,
      blueText,
      redText,
      blueStrategyIcon,
      redStrategyIcon
    };
  }

  private createStrategyButtons(callbacks: GameHudCallbacks): void {
    const buttonSize = 44;
    const gap = 7;
    const totalHeight = PLAYER_STRATEGIES.length * buttonSize + (PLAYER_STRATEGIES.length - 1) * gap;
    const startY = this.scene.scale.height / 2 - totalHeight / 2;
    const x = this.scene.scale.width - 30;

    PLAYER_STRATEGIES.forEach((strategy, index) => {
      const y = startY + index * (buttonSize + gap) + buttonSize / 2;
      const rect = this.scene.add
        .rectangle(x, y, buttonSize, buttonSize, 0x111827, 0.72)
        .setStrokeStyle(1, 0xf8fafc, 0.38)
        .setScrollFactor(0)
        .setDepth(100)
        .setInteractive({ useHandCursor: true });
      rect.on("pointerdown", () => callbacks.onSelectStrategy(strategy));
      this.strategyButtons.set(strategy, rect);

      this.scene.add
        .image(x, y - 2, STRATEGY_ASSET_KEYS[strategy])
        .setDisplaySize(32, 32)
        .setScrollFactor(0)
        .setDepth(101);

      this.scene.add
        .text(x + 14, y + 12, strategyHotkey(strategy), {
          fontFamily: "TinyWar Fira Sans",
          fontSize: "11px",
          color: "#f8fafc",
          backgroundColor: "rgba(15, 23, 42, 0.78)",
          padding: { x: 2, y: 0 }
        })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(102);

      const progressBg = this.scene.add
        .rectangle(x, y + buttonSize * 0.32, buttonSize * 0.68, 5, 0x020617, 0.82)
        .setScrollFactor(0)
        .setDepth(102)
        .setVisible(false);
      const progress = this.scene.add
        .rectangle(x - (buttonSize * 0.68) / 2, y + buttonSize * 0.32, buttonSize * 0.62, 3, 0x4795a7, 0.95)
        .setOrigin(0, 0.5)
        .setScrollFactor(0)
        .setDepth(103)
        .setVisible(false);
      this.strategyProgressBackgrounds.set(strategy, progressBg);
      this.strategyProgressBars.set(strategy, progress);
    });
  }

  private directionLabel(direction: PlayerDirection): string {
    return `${direction}  |  L`;
  }

  private queueLabel(queue: UnitQueue): string {
    return `Queue: ${queue.units.length}/10`;
  }

  private updateQueueDisplay(queue: UnitQueue): void {
    for (let index = 0; index < QUEUE_SLOT_COUNT; index += 1) {
      const queued = queue.units[index];
      const icon = this.queueIcons[index];
      const progressBg = this.queueProgressBackgrounds[index];
      const progress = this.queueProgressBars[index];
      if (!queued) {
        icon.setVisible(false);
        progressBg.setVisible(false);
        progress.setVisible(false);
        continue;
      }

      icon.setTexture(UNIT_ASSET_KEYS[queued.unit]).setVisible(true);
      const duration = UNIT_DEFINITIONS[queued.unit].spawnDurationMs;
      const fraction = Phaser.Math.Clamp(1 - queued.remainingMs / duration, 0, 1);
      progressBg.setVisible(index === 0 && fraction > 0);
      progress.setVisible(index === 0 && fraction > 0);
      progress.displayWidth = (progressBg.displayWidth - 4) * fraction;
    }
  }

  private hotkeyForUnit(unit: UnitName): string {
    return {
      Warrior: "Z",
      Lancer: "X",
      Archer: "C",
      Priest: "V"
    }[unit];
  }

  private advanceLabel(share: number, power: number): string {
    return `${Math.round(share * 100)}%\n${(power / 1000).toFixed(1)}k`;
  }

  private directionIconKey(direction: PlayerDirection): string {
    switch (direction) {
      case "Any":
        return ASSETS.icons.anyArrow.key;
      case "Top":
      case "Bot":
        return ASSETS.icons.topArrow.key;
      case "TopMid":
      case "MidBot":
        return ASSETS.icons.topMidArrow.key;
      case "Mid":
        return ASSETS.icons.midArrow.key;
      case "TopBot":
        return ASSETS.icons.topBotArrow.key;
    }
  }

  private directionFlipsY(direction: PlayerDirection): boolean {
    return direction === "Bot" || direction === "MidBot";
  }
}
