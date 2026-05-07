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
import { enqueueUnit, createQueue, tickQueue, type UnitQueue } from "../../core/queue/unitQueue";
import type { UnitName } from "../../core/units/unitData";
import { CameraDragController } from "../input/CameraDragController";
import { BuildingRenderer } from "../render/BuildingRenderer";
import type { BuildingRenderHandle } from "../render/BuildingRenderer";
import { MapRenderer } from "../render/MapRenderer";
import { ProjectileRenderer, type ProjectileRenderHandle } from "../render/ProjectileRenderer";
import { UnitRenderer, type UnitRenderHandle } from "../render/UnitRenderer";
import { resolveAndSyncCombat } from "../systems/CombatSync";
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
  private hud?: GameHud;
  private mapRenderer?: MapRenderer;
  private projectileRenderer!: ProjectileRenderer;
  private queue: UnitQueue = createQueue();
  private enemyQueue: EnemyQueueState = createEnemyQueue();
  private spawnCounter = 0;

  constructor() {
    super("GameScene");
  }

  create(): void {
    this.mapRenderer = new MapRenderer(this);
    this.mapRenderer.render();
    const state = createInitialGameState();
    this.buildings = [...state.buildings];
    this.buildingSprites = new BuildingRenderer(this).render(this.buildings);
    const unitRenderer = new UnitRenderer(this);
    unitRenderer.render(state.units);
    this.projectileRenderer = new ProjectileRenderer(this);

    const mapSize = this.mapRenderer.getWorldSize();
    this.cameras.main.setBounds(0, 0, mapSize.x, mapSize.y);
    this.fitMapToViewport(mapSize);
    this.cameraDrag = new CameraDragController(this);
    this.hud = new GameHud(this, this.selectedDirection, this.queue, {
      onCycleDirection: () => this.cycleDirection(),
      onQueueUnit: (unit) => this.queueUnit(unit)
    });

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

    const enemyResult = tickEnemyQueue(this.enemyQueue, delta);
    this.enemyQueue = enemyResult.state;
    for (const unitName of enemyResult.spawned) {
      this.spawnQueuedUnit(unitName, "Red");
    }

    this.debugUnits = this.debugUnits.map((unit) => {
      const previousX = unit.position.x;
      const moved = unit.moving ? updateMovingUnit(unit, delta / 1000) : unit;
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
        projectileRenderer: this.projectileRenderer
      },
      delta
    );
    this.debugUnits = combat.units;
    this.buildings = combat.buildings;
    this.projectiles = combat.projectiles;

    if (combat.winner) {
      this.hud?.showWinner(combat.winner);
    }
  }

  shutdown(): void {
    this.cameraDrag?.destroy();
  }

  private layout(gameSize: Phaser.Structs.Size): void {
    this.cameras.main.setSize(gameSize.width, gameSize.height);
    this.scene.restart();
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
    this.queue = enqueueUnit(this.queue, unitName);
    this.hud?.updateQueue(this.queue);
  }

  private cycleDirection(): void {
    this.selectedDirection = nextDirection(this.selectedDirection);
    this.hud?.updateDirection(this.selectedDirection);
  }
}
