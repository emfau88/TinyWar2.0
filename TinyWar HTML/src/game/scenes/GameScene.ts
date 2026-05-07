import Phaser from "phaser";
import { createEnemyQueue, tickEnemyQueue, type EnemyQueueState } from "../../core/ai/enemyQueue";
import type { BuildingInstance } from "../../core/buildings/buildingData";
import type { ProjectileInstance } from "../../core/combat/projectileSystem";
import { createInitialGameState } from "../../core/game/createInitialGameState";
import {
  createLaneUnit,
  updateMovingUnit,
  type MovingUnit
} from "../../core/movement/movementSystem";
import { lanesForDirection, nextDirection, type PlayerDirection } from "../../core/player/playerDirection";
import {
  createStrategyState,
  selectStrategy,
  tickStrategyCooldown,
  type PlayerStrategy,
  type StrategyState
} from "../../core/player/playerStrategy";
import { enqueueUnit, createQueue, tickQueue, type UnitQueue } from "../../core/queue/unitQueue";
import { UNITS as UNIT_DEFINITIONS, type UnitName } from "../../core/units/unitData";
import { CameraDragController } from "../input/CameraDragController";
import { BuildingRenderer } from "../render/BuildingRenderer";
import type { BuildingRenderHandle } from "../render/BuildingRenderer";
import { MapDebugOverlay } from "../render/MapDebugOverlay";
import { MapRenderer } from "../render/MapRenderer";
import { ProjectileRenderer, type ProjectileRenderHandle } from "../render/ProjectileRenderer";
import { UnitRenderer, type UnitRenderHandle } from "../render/UnitRenderer";
import { resolveAndSyncCombat } from "../systems/CombatSync";
import { GameAudio } from "../systems/GameAudio";
import { GameHud } from "../ui/GameHud";

export class GameScene extends Phaser.Scene {
  private cameraDrag?: CameraDragController;
  private debugUnits: MovingUnit[] = [];
  private debugUnitSprites = new Map<string, UnitRenderHandle>();
  private buildingSprites = new Map<string, BuildingRenderHandle>();
  private projectileSprites = new Map<string, ProjectileRenderHandle>();
  private buildings: BuildingInstance[] = [];
  private projectiles: ProjectileInstance[] = [];
  private selectedDirection: PlayerDirection = "Any";
  private strategy: StrategyState = createStrategyState();
  private mapWorldWidth = 0;
  private hud?: GameHud;
  private hudCamera?: Phaser.Cameras.Scene2D.Camera;
  private mapDebugOverlay?: MapDebugOverlay;
  private mapRenderer?: MapRenderer;
  private projectileRenderer!: ProjectileRenderer;
  private audio?: GameAudio;
  private audioMuted = false;
  private queue: UnitQueue = createQueue();
  private enemyQueue: EnemyQueueState = createEnemyQueue();
  private spawnCounter = 0;

  constructor() {
    super("GameScene");
  }

  create(): void {
    this.audio = new GameAudio(this);
    this.mapRenderer = new MapRenderer(this);
    this.mapRenderer.render();
    const state = createInitialGameState();
    this.buildings = [...state.buildings];
    this.buildingSprites = new BuildingRenderer(this).render(this.buildings);
    const unitRenderer = new UnitRenderer(this);
    unitRenderer.render(state.units);
    this.projectileRenderer = new ProjectileRenderer(this);

    const mapSize = this.mapRenderer.getWorldSize();
    this.mapWorldWidth = mapSize.x;
    this.cameras.main.setBounds(0, 0, mapSize.x, mapSize.y);
    this.fitMapToViewport(mapSize);
    this.cameraDrag = new CameraDragController(this);
    this.hud = new GameHud(this, this.selectedDirection, this.strategy, this.queue, {
      onCycleDirection: () => this.cycleDirection(),
      onQueueUnit: (unit) => this.queueUnit(unit),
      onSelectStrategy: (strategy) => this.selectStrategy(strategy),
      onToggleAudio: () => this.toggleAudio()
    });
    this.hud.updateAudioMuted(this.audioMuted);
    this.updateAdvanceBanner();
    this.mapDebugOverlay = new MapDebugOverlay(this);
    this.setupHudCamera();
    this.input.keyboard?.on("keydown-M", () => this.mapDebugOverlay?.toggle());

    this.scale.on("resize", this.layout, this);
  }

  update(_time: number, delta: number): void {
    this.mapRenderer?.update(delta);

    if (this.hud?.isWinnerVisible) {
      return;
    }

    const result = tickQueue(this.queue, delta);
    this.queue = result.queue;
    for (const unitName of result.spawned) {
      this.spawnQueuedUnit(unitName, "Blue");
    }
    this.hud?.updateQueue(this.queue);
    this.strategy = tickStrategyCooldown(this.strategy, delta);
    this.hud?.updateStrategy(this.strategy);

    const enemyResult = tickEnemyQueue(this.enemyQueue, delta);
    this.enemyQueue = enemyResult.state;
    for (const unitName of enemyResult.spawned) {
      this.spawnQueuedUnit(unitName, "Red");
    }

    this.debugUnits = this.debugUnits.map((unit) => {
      const previousX = unit.position.x;
      const moved = unit.moving ? updateMovingUnit(unit, delta / 1000, this.strategyForUnit(unit)) : unit;
      const handle = this.debugUnitSprites.get(unit.id);
      if (handle) {
        UnitRenderer.updateHandle(handle, moved, UnitRenderer.actionForUnit(moved));
        if (moved.moving && Math.abs(moved.position.x - previousX) > 0.01) {
          handle.sprite.setFlipX(moved.position.x < previousX);
        }
      }
      return moved;
    });

    const combat = resolveAndSyncCombat(
      {
        units: this.debugUnits,
        buildings: this.buildings,
        projectiles: this.projectiles,
        unitHandles: this.debugUnitSprites,
        buildingHandles: this.buildingSprites,
        projectileHandles: this.projectileSprites,
        projectileRenderer: this.projectileRenderer,
        strategies: {
          Blue: this.strategy.current,
          Red: "Attack"
        }
      },
      delta
    );
    this.playCombatResultAudio(this.buildings, combat.buildings, combat.winner);
    this.debugUnits = combat.units;
    this.buildings = combat.buildings;
    this.projectiles = combat.projectiles;

    if (combat.winner) {
      this.hud?.showWinner(combat.winner);
    }
    this.updateAdvanceBanner();
    this.syncCameraMasks();
  }

  shutdown(): void {
    this.cameraDrag?.destroy();
    this.mapDebugOverlay?.destroy();
  }

  private layout(gameSize: Phaser.Structs.Size): void {
    this.cameras.main.setSize(gameSize.width, gameSize.height);
    this.hudCamera?.setSize(gameSize.width, gameSize.height);
    const mapSize = this.mapRenderer?.getWorldSize();
    if (mapSize) {
      this.fitMapToViewport(mapSize);
    }
    this.hud?.layout(gameSize.width, gameSize.height);
    this.updateAdvanceBanner();
    this.syncCameraMasks();
  }

  private fitMapToViewport(mapSize: Phaser.Math.Vector2): void {
    const camera = this.cameras.main;
    const zoom = Phaser.Math.Clamp(
      Math.min(this.scale.width / mapSize.x, this.scale.height / mapSize.y) * 0.92,
      0.35,
      1
    );

    camera.setZoom(zoom);
    camera.centerOn(mapSize.x / 2, mapSize.y / 2);
  }

  private spawnQueuedUnit(unitName: UnitName, color: "Blue" | "Red"): void {
    const renderer = new UnitRenderer(this);
    const units = lanesForDirection(this.selectedDirection).map((lane, index) =>
      createLaneUnit(unitName, lane, index, `${color.toLowerCase()}-${this.spawnCounter}`, color)
    );
    this.spawnCounter += 1;

    for (const unit of units) {
      this.debugUnits.push(unit);
      this.debugUnitSprites.set(unit.id, renderer.renderUnit(unit, "Run"));
    }
  }

  private queueUnit(unitName: UnitName): void {
    const previousLength = this.queue.units.length;
    this.queue = enqueueUnit(this.queue, unitName);
    this.audio?.play(this.queue.units.length > previousLength ? "button" : "error");
    this.hud?.updateQueue(this.queue);
  }

  private cycleDirection(): void {
    this.selectedDirection = nextDirection(this.selectedDirection);
    this.audio?.play("click");
    this.hud?.updateDirection(this.selectedDirection);
  }

  private selectStrategy(strategy: PlayerStrategy): void {
    const result = selectStrategy(this.strategy, strategy);
    if (result.changed) {
      this.audio?.play("click");
    } else if (this.strategy.current !== strategy && this.strategy.remainingCooldownMs > 0) {
      this.audio?.play("error");
    }
    this.strategy = result.state;
    this.hud?.updateStrategy(this.strategy);
    this.updateAdvanceBanner();
  }

  private toggleAudio(): void {
    this.audioMuted = !this.audioMuted;
    this.audio?.setMuted(this.audioMuted);
    this.hud?.updateAudioMuted(this.audioMuted);
    if (!this.audioMuted) {
      this.audio?.play("click");
    }
  }

  private strategyForUnit(unit: MovingUnit): PlayerStrategy {
    return unit.color === "Blue" ? this.strategy.current : "Attack";
  }

  private updateAdvanceBanner(): void {
    this.hud?.updateAdvanceBanner(this.calculateAdvanceBannerState());
  }

  private playCombatResultAudio(
    previousBuildings: readonly BuildingInstance[],
    nextBuildings: readonly BuildingInstance[],
    winner?: "Blue" | "Red"
  ): void {
    if (nextBuildings.some((building) => building.health <= 0 && previousBuildings.some((previous) => previous.id === building.id && previous.health > 0))) {
      this.audio?.play("explosion");
    }

    if (winner && !this.hud?.isWinnerVisible) {
      this.audio?.play(winner === "Blue" ? "victory" : "defeat");
    }
  }

  private setupHudCamera(): void {
    this.hudCamera = this.cameras.add(0, 0, this.scale.width, this.scale.height);
    this.hudCamera.setScroll(0, 0);
    this.hudCamera.setZoom(1);
    this.syncCameraMasks();
  }

  private syncCameraMasks(): void {
    if (!this.hud || !this.hudCamera) {
      return;
    }

    const hudObjects = this.hud.objects;
    const hudObjectSet = new Set(hudObjects);
    this.cameras.main.ignore(hudObjects);
    this.hudCamera.ignore(this.children.list.filter((child) => !hudObjectSet.has(child)));
  }

  private calculateAdvanceBannerState() {
    let blue = 50;
    let red = 50;
    let bluePower = 0;
    let redPower = 0;
    const centerX = this.mapWorldWidth / 2;

    for (const unit of this.debugUnits) {
      const power = UNIT_DEFINITIONS[unit.name].spawnDurationMs * (unit.health / unit.maxHealth);
      if (unit.color === "Blue") {
        bluePower += power;
        const x = (unit.position.x - centerX) / 64;
        if (x > 0) {
          blue += (1 / (1 + Math.exp(-1.5 * x)) - 0.5) * 20;
        }
      } else {
        redPower += power;
        const x = (centerX - unit.position.x) / 64;
        if (x > 0) {
          red += (1 / (1 + Math.exp(-1.5 * x)) - 0.5) * 20;
        }
      }
    }

    const total = blue + red;
    const blueShare = total > 0 ? blue / total : 0.5;

    return {
      blueShare,
      redShare: 1 - blueShare,
      bluePower,
      redPower,
      blueStrategy: this.strategy.current,
      redStrategy: "Attack" as const
    };
  }
}
