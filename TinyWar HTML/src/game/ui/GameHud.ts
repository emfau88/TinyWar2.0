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

interface UnitShopButton {
  rect: Phaser.GameObjects.Rectangle;
  icon: Phaser.GameObjects.Image;
  label: Phaser.GameObjects.Text;
}

interface StrategyButton {
  rect: Phaser.GameObjects.Rectangle;
  icon: Phaser.GameObjects.Image;
  label: Phaser.GameObjects.Text;
  progressBg: Phaser.GameObjects.Rectangle;
  progress: Phaser.GameObjects.Rectangle;
}

export class GameHud {
  private readonly blueAdvanceStart: Phaser.GameObjects.Image;
  private readonly blueAdvanceJoin: Phaser.GameObjects.Image;
  private readonly blueAdvanceFill: Phaser.GameObjects.Image;
  private readonly redAdvanceFill: Phaser.GameObjects.Image;
  private readonly redAdvanceJoin: Phaser.GameObjects.Image;
  private readonly redAdvanceEnd: Phaser.GameObjects.Image;
  private readonly blueAdvanceText: Phaser.GameObjects.Text;
  private readonly redAdvanceText: Phaser.GameObjects.Text;
  private readonly blueAdvanceStrategyIcon: Phaser.GameObjects.Image;
  private readonly redAdvanceStrategyIcon: Phaser.GameObjects.Image;
  private readonly directionPanel: Phaser.GameObjects.Rectangle;
  private readonly directionIcon: Phaser.GameObjects.Image;
  private readonly directionText: Phaser.GameObjects.Text;
  private readonly queueText: Phaser.GameObjects.Text;
  private readonly winnerText: Phaser.GameObjects.Text;
  private readonly queueStart: Phaser.GameObjects.Image;
  private readonly queueEnd: Phaser.GameObjects.Image;
  private readonly queueSlotBackgrounds: Phaser.GameObjects.Image[] = [];
  private readonly queueIcons: Phaser.GameObjects.Image[] = [];
  private readonly queueProgressBackgrounds: Phaser.GameObjects.Rectangle[] = [];
  private readonly queueProgressBars: Phaser.GameObjects.Rectangle[] = [];
  private readonly shopButtons: UnitShopButton[] = [];
  private readonly strategyButtons = new Map<PlayerStrategy, StrategyButton>();
  private lastAdvanceState?: AdvanceBannerState;

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
    this.blueAdvanceStart = advance.blueStart;
    this.blueAdvanceJoin = advance.blueJoin;
    this.blueAdvanceFill = advance.blueFill;
    this.redAdvanceFill = advance.redFill;
    this.redAdvanceJoin = advance.redJoin;
    this.redAdvanceEnd = advance.redEnd;
    this.blueAdvanceText = advance.blueText;
    this.redAdvanceText = advance.redText;
    this.blueAdvanceStrategyIcon = advance.blueStrategyIcon;
    this.redAdvanceStrategyIcon = advance.redStrategyIcon;
    this.lastAdvanceState = initialAdvance;

    this.directionPanel = this.scene.add
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
    const queueDisplay = this.createQueueDisplay();
    this.queueStart = queueDisplay.start;
    this.queueEnd = queueDisplay.end;
    this.layout(this.scene.scale.width, this.scene.scale.height);
    this.updateAdvanceBanner(initialAdvance);
    this.updateStrategy(strategy);
    this.updateQueue(queue);
  }

  get isWinnerVisible(): boolean {
    return this.winnerText.visible;
  }

  get objects(): Phaser.GameObjects.GameObject[] {
    return [
      this.blueAdvanceFill,
      this.redAdvanceFill,
      this.blueAdvanceStart,
      this.blueAdvanceJoin,
      this.redAdvanceJoin,
      this.redAdvanceEnd,
      this.blueAdvanceText,
      this.redAdvanceText,
      this.blueAdvanceStrategyIcon,
      this.redAdvanceStrategyIcon,
      this.directionPanel,
      this.directionIcon,
      this.directionText,
      this.queueText,
      this.winnerText,
      this.queueStart,
      this.queueEnd,
      ...this.queueSlotBackgrounds,
      ...this.queueIcons,
      ...this.queueProgressBackgrounds,
      ...this.queueProgressBars,
      ...this.shopButtons.flatMap((button) => [button.rect, button.icon, button.label]),
      ...PLAYER_STRATEGIES.flatMap((strategy) => {
        const button = this.strategyButtons.get(strategy);
        return button ? [button.rect, button.icon, button.label, button.progressBg, button.progress] : [];
      })
    ];
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
      if (!button) {
        continue;
      }

      const active = item === strategy.current;
      button.rect.setStrokeStyle(active ? 2 : 1, active ? 0x4795a7 : 0xf8fafc, active ? 0.95 : 0.38);
      button.progressBg.setVisible(active && cooldownFraction > 0);
      button.progress.setVisible(active && cooldownFraction > 0);
      button.progress.displayWidth = Math.max(1, (button.progressBg.displayWidth - 4) * cooldownFraction);
    }
  }

  updateAdvanceBanner(state: AdvanceBannerState): void {
    this.lastAdvanceState = state;
    const width = Math.min(this.scene.scale.width * 0.68, 560);
    const capWidth = 32;
    const fixedWidth = capWidth * 4;
    const flexibleWidth = Math.max(80, width - fixedWidth);
    const minBodyWidth = 18;
    const blueBodyWidth = Math.max(
      minBodyWidth,
      flexibleWidth * Phaser.Math.Clamp(state.blueShare, 0.08, 0.92)
    );
    const redBodyWidth = Math.max(minBodyWidth, flexibleWidth - blueBodyWidth);
    const centerX = this.scene.scale.width / 2;
    const actualWidth = fixedWidth + blueBodyWidth + redBodyWidth;
    const leftX = centerX - actualWidth / 2;
    const blueStartX = leftX + capWidth / 2;
    const blueJoinX = leftX + capWidth + capWidth / 2;
    const blueBodyX = leftX + capWidth * 2 + blueBodyWidth / 2;
    const redBodyX = leftX + capWidth * 2 + blueBodyWidth + redBodyWidth / 2;
    const redJoinX = leftX + capWidth * 2 + blueBodyWidth + redBodyWidth + capWidth / 2;
    const redEndX = leftX + capWidth * 3 + blueBodyWidth + redBodyWidth + capWidth / 2;

    this.blueAdvanceStart.setDisplaySize(capWidth, 44).setPosition(blueStartX, this.blueAdvanceStart.y);
    this.blueAdvanceJoin.setDisplaySize(capWidth, 44).setPosition(blueJoinX, this.blueAdvanceJoin.y);
    this.blueAdvanceFill.setDisplaySize(blueBodyWidth, 44);
    this.redAdvanceFill.setDisplaySize(redBodyWidth, 44);
    this.blueAdvanceFill.setX(blueBodyX);
    this.redAdvanceFill.setX(redBodyX);
    this.redAdvanceJoin.setDisplaySize(capWidth, 44).setPosition(redJoinX, this.redAdvanceJoin.y);
    this.redAdvanceEnd.setDisplaySize(capWidth, 44).setPosition(redEndX, this.redAdvanceEnd.y);

    this.blueAdvanceText.setText(this.advanceLabel(state.blueShare, state.bluePower));
    this.redAdvanceText.setText(this.advanceLabel(state.redShare, state.redPower));
    this.blueAdvanceText.setX(blueBodyX);
    this.redAdvanceText.setX(redBodyX);
    this.blueAdvanceStrategyIcon.setTexture(STRATEGY_ASSET_KEYS[state.blueStrategy]);
    this.redAdvanceStrategyIcon.setTexture(STRATEGY_ASSET_KEYS[state.redStrategy]);
    this.blueAdvanceStrategyIcon.setX(leftX + capWidth * 2 + Math.min(24, blueBodyWidth * 0.18));
    this.redAdvanceStrategyIcon.setX(leftX + capWidth * 2 + blueBodyWidth + redBodyWidth - Math.min(24, redBodyWidth * 0.18));
  }

  layout(width: number, height: number): void {
    this.layoutAdvanceBanner(width);
    this.layoutDirection();
    this.layoutShopButtons(height);
    this.layoutStrategyButtons(width, height);
    this.layoutQueue(width, height);
    this.winnerText.setPosition(width / 2, 84);

    if (this.lastAdvanceState) {
      this.updateAdvanceBanner(this.lastAdvanceState);
    }
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

      const icon = this.scene.add
        .image(x, y - 2, UNIT_ASSET_KEYS[unit])
        .setDisplaySize(34, 34)
        .setScrollFactor(0)
        .setDepth(101);

      const label = this.scene.add
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
      this.shopButtons.push({ rect, icon, label });
    });
  }

  private createQueueDisplay(): { start: Phaser.GameObjects.Image; end: Phaser.GameObjects.Image } {
    const width = Math.min(this.scene.scale.width * 0.86, 640);
    const slotWidth = width / (QUEUE_SLOT_COUNT + 2);
    const slotHeight = Math.min(58, Math.max(42, slotWidth * 1.18));
    const y = this.scene.scale.height - slotHeight / 2 - 8;
    const startX = this.scene.scale.width / 2 - width / 2;

    const start = this.scene.add
      .image(startX + slotWidth / 2, y, ASSETS.ui.swords1.key, 0)
      .setDisplaySize(slotWidth, slotHeight)
      .setScrollFactor(0)
      .setDepth(98);

    for (let index = 0; index < QUEUE_SLOT_COUNT; index += 1) {
      const x = startX + slotWidth * (index + 1.5);
      const background = this.scene.add
        .image(x, y, ASSETS.ui.swords2.key)
        .setDisplaySize(slotWidth, slotHeight)
        .setScrollFactor(0)
        .setDepth(98);
      this.queueSlotBackgrounds.push(background);

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

    const end = this.scene.add
      .image(startX + slotWidth * (QUEUE_SLOT_COUNT + 1.5), y, ASSETS.ui.swords3.key)
      .setDisplaySize(slotWidth, slotHeight)
      .setScrollFactor(0)
      .setDepth(98);
    return { start, end };
  }

  private createAdvanceBanner(): {
    blueStart: Phaser.GameObjects.Image;
    blueJoin: Phaser.GameObjects.Image;
    blueFill: Phaser.GameObjects.Image;
    redFill: Phaser.GameObjects.Image;
    redJoin: Phaser.GameObjects.Image;
    redEnd: Phaser.GameObjects.Image;
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
    const blueStartFrame = BLUE_RIBBON_INDEX * LARGE_RIBBON_FRAMES_PER_COLOR;
    const blueJoinFrame = BLUE_RIBBON_INDEX * LARGE_RIBBON_FRAMES_PER_COLOR + 1;
    const redJoinFrame = RED_RIBBON_INDEX * LARGE_RIBBON_FRAMES_PER_COLOR + 5;
    const redEndFrame = RED_RIBBON_INDEX * LARGE_RIBBON_FRAMES_PER_COLOR + 6;

    const blueStart = this.scene.add
      .image(centerX - 312, y, ASSETS.ui.largeRibbons.key, blueStartFrame)
      .setDisplaySize(32, 44)
      .setScrollFactor(0)
      .setDepth(depth);
    const blueJoin = this.scene.add
      .image(centerX - 280, y, ASSETS.ui.largeRibbons.key, blueJoinFrame)
      .setDisplaySize(32, 44)
      .setScrollFactor(0)
      .setDepth(depth);

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
    const redJoin = this.scene.add
      .image(centerX + 280, y, ASSETS.ui.largeRibbons.key, redJoinFrame)
      .setDisplaySize(32, 44)
      .setScrollFactor(0)
      .setDepth(depth + 1);
    const redEnd = this.scene.add
      .image(centerX + 312, y, ASSETS.ui.largeRibbons.key, redEndFrame)
      .setDisplaySize(32, 44)
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
      color: "#f8fafc",
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
      blueStart,
      blueJoin,
      blueFill,
      redFill,
      redJoin,
      redEnd,
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

      const icon = this.scene.add
        .image(x, y - 2, STRATEGY_ASSET_KEYS[strategy])
        .setDisplaySize(32, 32)
        .setScrollFactor(0)
        .setDepth(101);

      const label = this.scene.add
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
      this.strategyButtons.set(strategy, { rect, icon, label, progressBg, progress });
    });
  }

  private layoutAdvanceBanner(width: number): void {
    const centerX = width / 2;
    const y = 38;
    this.blueAdvanceFill.setY(y);
    this.redAdvanceFill.setY(y);
    this.blueAdvanceStart.setY(y);
    this.blueAdvanceJoin.setY(y);
    this.redAdvanceJoin.setY(y);
    this.redAdvanceEnd.setY(y);
    this.blueAdvanceText.setY(y);
    this.redAdvanceText.setY(y);
    this.blueAdvanceStrategyIcon.setY(y);
    this.redAdvanceStrategyIcon.setY(y);
    this.blueAdvanceFill.setX(centerX - 140);
    this.redAdvanceFill.setX(centerX + 140);
  }

  private layoutDirection(): void {
    this.directionPanel.setPosition(34, 92);
    this.directionIcon.setPosition(34, 92);
    this.directionText.setPosition(66, 74);
  }

  private layoutShopButtons(height: number): void {
    const buttonSize = 44;
    const gap = 7;
    const totalHeight = this.shopButtons.length * buttonSize + (this.shopButtons.length - 1) * gap;
    const startY = height / 2 - totalHeight / 2;
    const x = 30;

    this.shopButtons.forEach((button, index) => {
      const y = startY + index * (buttonSize + gap) + buttonSize / 2;
      button.rect.setPosition(x, y).setSize(buttonSize, buttonSize);
      button.icon.setPosition(x, y - 2).setDisplaySize(34, 34);
      button.label.setPosition(x + 14, y + 12);
    });
  }

  private layoutStrategyButtons(width: number, height: number): void {
    const buttonSize = 44;
    const gap = 7;
    const totalHeight = PLAYER_STRATEGIES.length * buttonSize + (PLAYER_STRATEGIES.length - 1) * gap;
    const startY = height / 2 - totalHeight / 2;
    const x = width - 30;

    PLAYER_STRATEGIES.forEach((strategy, index) => {
      const button = this.strategyButtons.get(strategy);
      if (!button) {
        return;
      }
      const y = startY + index * (buttonSize + gap) + buttonSize / 2;
      button.rect.setPosition(x, y).setSize(buttonSize, buttonSize);
      button.icon.setPosition(x, y - 2).setDisplaySize(32, 32);
      button.label.setPosition(x + 14, y + 12);
      button.progressBg.setPosition(x, y + buttonSize * 0.32).setSize(buttonSize * 0.68, 5);
      button.progress.setPosition(x - (buttonSize * 0.68) / 2, y + buttonSize * 0.32).setSize(buttonSize * 0.62, 3);
    });
  }

  private layoutQueue(width: number, height: number): void {
    const queueWidth = Math.min(width * 0.86, 640);
    const slotWidth = queueWidth / (QUEUE_SLOT_COUNT + 2);
    const slotHeight = Math.min(58, Math.max(42, slotWidth * 1.18));
    const y = height - slotHeight / 2 - 8;
    const startX = width / 2 - queueWidth / 2;

    this.queueStart.setPosition(startX + slotWidth / 2, y).setDisplaySize(slotWidth, slotHeight);
    for (let index = 0; index < QUEUE_SLOT_COUNT; index += 1) {
      const x = startX + slotWidth * (index + 1.5);
      this.queueSlotBackgrounds[index].setPosition(x, y).setDisplaySize(slotWidth, slotHeight);
      this.queueIcons[index].setPosition(x, y - 3).setDisplaySize(slotHeight * 0.55, slotHeight * 0.55);
      this.queueProgressBackgrounds[index].setPosition(x, y + slotHeight * 0.26).setSize(slotWidth * 0.62, 5);
      this.queueProgressBars[index].setPosition(x - (slotWidth * 0.62) / 2, y + slotHeight * 0.26).setSize(slotWidth * 0.58, 3);
    }
    this.queueEnd.setPosition(startX + slotWidth * (QUEUE_SLOT_COUNT + 1.5), y).setDisplaySize(slotWidth, slotHeight);
    this.queueText.setPosition(12, Math.max(12, y - slotHeight / 2 - 28));
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
