import Phaser from "phaser";
import {
  createEnemyCommander,
  tickEnemyCommander,
  type EnemyCommanderState
} from "../../core/ai/enemyCommander";
import {
  createMonsterDirector,
  tickMonsterDirector,
  type MonsterDirectorState
} from "../../core/ai/monsterDirector";
import { setActiveMap, getActiveMap } from "../../core/map/activeMap";
import { CLASSIC_MAP, type MapId } from "../../core/map/mapDefinition";
import { WILDNIS_MAP } from "../../core/map/wildnisMap";
import { tileToWorld } from "../../core/map/mapGeometry";
import type { PlayerColor } from "../../core/buildings/buildingData";
import {
  createBoostState,
  selectBoost,
  setBoostDraftInterval,
  skipOffer,
  tickBoosts,
  type BoostState
} from "../../core/boosts/boostState";
import type { BoostName } from "../../core/boosts/boostData";
import {
  applyInstantHealing,
  applyLightning,
  applyRepair,
  bearDefenderRequests,
  cloneRequests,
  instantArmyRequests,
  snakeSwarmRequests,
  trollRequests,
  type SpawnRequest
} from "../../core/boosts/instantBoosts";
import {
  canAfford,
  createGoldState,
  spendForUnit,
  tickGold,
  type GoldState
} from "../../core/economy/goldEconomy";
import {
  getBuildingDoorSpawnPosition,
  type BuildingInstance
} from "../../core/buildings/buildingData";
import type { ProjectileInstance } from "../../core/combat/projectileSystem";
import { createInitialGameState } from "../../core/game/createInitialGameState";
import {
  createLaneUnit,
  stationaryBuildingUnit,
  updateMovingUnit,
  type MovingUnit
} from "../../core/movement/movementSystem";
import { nextDirection, randomLaneForDirection, type PlayerDirection } from "../../core/player/playerDirection";
import {
  createStrategyState,
  selectStrategy,
  tickStrategyCooldown,
  type PlayerStrategy,
  type StrategyState
} from "../../core/player/playerStrategy";
import { enqueueUnit, createQueue, tickQueue, type UnitQueue } from "../../core/queue/unitQueue";
import { UNITS as UNIT_DEFINITIONS, type UnitName } from "../../core/units/unitData";
import {
  CameraDragController,
  DESKTOP_MIN_ZOOM,
  MOBILE_MAX_ZOOM,
  MOBILE_MIN_ZOOM,
  clampCameraScrollToBounds
} from "../input/CameraDragController";
import { BuildingRenderer } from "../render/BuildingRenderer";
import type { BuildingRenderHandle } from "../render/BuildingRenderer";
import { MapDebugOverlay } from "../render/MapDebugOverlay";
import { MapRenderer } from "../render/MapRenderer";
import { ProjectileRenderer, type ProjectileRenderHandle } from "../render/ProjectileRenderer";
import { UnitRenderer, type UnitRenderHandle } from "../render/UnitRenderer";
import { resolveAndSyncCombat } from "../systems/CombatSync";
import { GameAudio } from "../systems/GameAudio";
import { GameHud } from "../ui/GameHud";

const MIN_GAME_SPEED = 0.25;
const MAX_GAME_SPEED = 16;
const MOBILE_VIEWPORT_MAX_WIDTH = 900;
const MOBILE_VIEWPORT_MAX_HEIGHT = 600;
const MOBILE_PORTRAIT_DEFAULT_ZOOM = 0.9;
const MOBILE_LANDSCAPE_DEFAULT_ZOOM = 0.7;

type CameraViewportProfile = "desktop" | "mobile-portrait" | "mobile-landscape";

function cameraVisibleWorldSize(camera: Phaser.Cameras.Scene2D.Camera): Phaser.Math.Vector2 {
  return new Phaser.Math.Vector2(camera.width / camera.zoom, camera.height / camera.zoom);
}

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
  private paused = false;
  private gameSpeed = 1;
  private queue: UnitQueue = createQueue();
  private playerGold: GoldState = createGoldState();
  private enemyCommander: EnemyCommanderState = createEnemyCommander();
  private monsterDirector: MonsterDirectorState = createMonsterDirector();
  private boosts: BoostState = createBoostState();
  private mode: MapId = "classic";
  private spawnCounter = 0;

  constructor() {
    super("GameScene");
  }

  init(data: { mode?: MapId } = {}): void {
    this.mode = data.mode === "wildnis" ? "wildnis" : "classic";
    setActiveMap(this.mode === "wildnis" ? WILDNIS_MAP : CLASSIC_MAP);
    // Dev aid: ?boostfast shortens the draft cadence for quick testing.
    if (typeof window !== "undefined" && new URLSearchParams(window.location.search).has("boostfast")) {
      setBoostDraftInterval(1500);
    }
  }

  private get opponentColor(): PlayerColor {
    return getActiveMap().bases.opponent.color;
  }

  create(): void {
    // Phaser reuses the scene instance on restart, so every piece of match
    // state has to be reset here rather than in field initializers.
    this.debugUnitSprites = new Map();
    this.buildingSprites = new Map();
    this.projectileSprites = new Map();
    this.projectiles = [];
    this.selectedDirection = "Any";
    this.strategy = createStrategyState();
    this.paused = false;
    this.gameSpeed = 1;
    this.queue = createQueue();
    this.playerGold = createGoldState();
    this.enemyCommander = createEnemyCommander();
    this.monsterDirector = createMonsterDirector();
    this.boosts = createBoostState();
    this.spawnCounter = 0;

    this.audio = new GameAudio(this);
    this.mapRenderer = new MapRenderer(this);
    this.mapRenderer.render();
    const state = createInitialGameState();
    this.buildings = [...state.buildings];
    this.buildingSprites = new BuildingRenderer(this).render(this.buildings);
    const unitRenderer = new UnitRenderer(this);
    this.debugUnits = state.units.map((unit) => stationaryBuildingUnit(unit));
    this.debugUnitSprites = unitRenderer.render(this.debugUnits);
    this.projectileRenderer = new ProjectileRenderer(this);

    const mapSize = this.mapRenderer.getWorldSize();
    this.mapWorldWidth = mapSize.x;
    this.cameras.main.setBounds(0, 0, mapSize.x, mapSize.y);
    this.applyCameraFraming(mapSize);
    this.cameraDrag = new CameraDragController(this);
    this.hud = new GameHud(
      this,
      this.selectedDirection,
      this.strategy,
      this.queue,
      {
        onCycleDirection: () => this.cycleDirection(),
        onQueueUnit: (unit) => this.queueUnit(unit),
        onSelectStrategy: (strategy) => this.selectStrategy(strategy),
        onToggleAudio: () => this.toggleAudio(),
        onToggleUnitInfo: () => this.toggleUnitInfo(),
        onPlayAgain: () => this.scene.restart({ mode: this.mode }),
        onExitToMenu: () => this.scene.start("MenuScene"),
        onChooseBoost: (name) => this.chooseBoost(name),
        onDismissBoostOffer: () => this.dismissBoostOffer()
      },
      { showDirectionSelector: getActiveMap().availableLanes.length > 1 }
    );
    this.hud.updateAudioMuted(this.audioMuted);
    this.hud.updateSpeed(this.gameSpeed, this.paused);
    this.hud.updateGold(this.playerGold);
    this.updateAdvanceBanner();
    this.mapDebugOverlay = new MapDebugOverlay(this);
    this.setupHudCamera();
    this.input.keyboard?.on("keydown-M", () => this.mapDebugOverlay?.toggle());
    this.input.keyboard?.on("keyup-SPACE", this.togglePause, this);
    this.input.keyboard?.on("keyup-LEFT", this.adjustGameSpeed, this);
    this.input.keyboard?.on("keyup-RIGHT", this.adjustGameSpeed, this);

    this.scale.off("resize", this.layout, this);
    this.scale.on("resize", this.layout, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.shutdown());
  }

  update(_time: number, delta: number): void {
    const effectiveDelta = this.paused ? 0 : delta * this.gameSpeed;
    this.mapRenderer?.update(effectiveDelta);

    if (this.hud?.isWinnerVisible) {
      return;
    }

    if (this.paused) {
      this.syncCameraMasks();
      return;
    }

    this.playerGold = tickGold(this.playerGold, effectiveDelta);
    this.hud?.updateGold(this.playerGold);
    const result = tickQueue(this.queue, effectiveDelta);
    this.queue = result.queue;
    for (const unitName of result.spawned) {
      this.spawnQueuedUnit(unitName, "Blue");
    }
    this.hud?.updateQueue(this.queue);
    this.strategy = tickStrategyCooldown(this.strategy, effectiveDelta);
    this.hud?.updateStrategy(this.strategy);

    const boostsBefore = this.boosts;
    this.boosts = tickBoosts(this.boosts, effectiveDelta);
    if (this.boosts.offer && !boostsBefore.offer) {
      this.audio?.play("message");
    }
    this.hud?.updateBoosts(this.boosts);

    if (this.mode === "wildnis") {
      const monsterResult = tickMonsterDirector(this.monsterDirector, effectiveDelta);
      this.monsterDirector = monsterResult.state;
      if (monsterResult.trollWarning) {
        this.audio?.play("warning");
      }
      for (const unitName of monsterResult.spawned) {
        this.spawnQueuedUnit(unitName, this.opponentColor);
      }
    } else {
      const enemyResult = tickEnemyCommander(this.enemyCommander, effectiveDelta);
      this.enemyCommander = enemyResult.state;
      for (const unitName of enemyResult.spawned) {
        this.spawnQueuedUnit(unitName, this.opponentColor);
      }
    }

    this.debugUnits = this.debugUnits.map((unit) => {
      const previousX = unit.position.x;
      const previousY = unit.position.y;
      const speedBoost = unit.color === "Blue" ? this.playerSpeedBoost() : 1;
      const moved = unit.moving
        ? updateMovingUnit(unit, effectiveDelta / 1000, this.strategyForUnit(unit), speedBoost)
        : unit;
      const handle = this.debugUnitSprites.get(unit.id);
      if (handle) {
        UnitRenderer.updateHandle(handle, moved, UnitRenderer.actionForUnit(moved));
        if (moved.moving && Math.abs(moved.position.x - previousX) > 0.01) {
          handle.sprite.setFlipX(moved.position.x < previousX);
        }
      }
      const deltaSeconds = effectiveDelta / 1000;
      const velocity =
        moved.moving && deltaSeconds > 0
          ? {
              x: (moved.position.x - previousX) / deltaSeconds,
              y: (moved.position.y - previousY) / deltaSeconds
            }
          : { x: 0, y: 0 };
      return { ...moved, velocity };
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
        },
        boosts: {
          Blue: this.boosts.active
        }
      },
      effectiveDelta
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
    this.cameraDrag = undefined;
    this.mapDebugOverlay?.destroy();
    this.mapDebugOverlay = undefined;
    this.hudCamera = undefined;
    this.hud = undefined;
    this.scale.off("resize", this.layout, this);
    this.input.keyboard?.off("keyup-SPACE", this.togglePause, this);
    this.input.keyboard?.off("keyup-LEFT", this.adjustGameSpeed, this);
    this.input.keyboard?.off("keyup-RIGHT", this.adjustGameSpeed, this);
  }

  private layout(gameSize: Phaser.Structs.Size): void {
    const previousCenter = this.cameraCenterWorld();
    this.cameras.main.setSize(gameSize.width, gameSize.height);
    this.hudCamera?.setSize(gameSize.width, gameSize.height);
    const mapSize = this.mapRenderer?.getWorldSize();
    if (mapSize) {
      this.applyCameraFraming(mapSize, previousCenter);
    }
    this.hud?.layout(gameSize.width, gameSize.height);
    this.updateAdvanceBanner();
    this.syncCameraMasks();
  }

  private applyCameraFraming(
    mapSize: Phaser.Math.Vector2,
    preserveCenter?: Phaser.Math.Vector2
  ): void {
    const camera = this.cameras.main;
    const profile = this.cameraViewportProfile();
    const zoom = this.targetZoomForProfile(profile, mapSize);

    camera.setZoom(zoom);
    if (preserveCenter) {
      camera.centerOn(preserveCenter.x, preserveCenter.y);
      clampCameraScrollToBounds(camera);
      return;
    }

    const startCenter = this.startCenterForProfile(profile, mapSize, zoom);
    camera.centerOn(startCenter.x, startCenter.y);
    clampCameraScrollToBounds(camera);
  }

  private cameraViewportProfile(): CameraViewportProfile {
    const width = this.scale.width;
    const height = this.scale.height;
    const mobileViewport = width <= MOBILE_VIEWPORT_MAX_WIDTH || height <= MOBILE_VIEWPORT_MAX_HEIGHT;
    if (!mobileViewport) {
      return "desktop";
    }

    return height > width ? "mobile-portrait" : "mobile-landscape";
  }

  private targetZoomForProfile(profile: CameraViewportProfile, mapSize: Phaser.Math.Vector2): number {
    if (profile === "desktop") {
      return Phaser.Math.Clamp(
        Math.min(this.scale.width / mapSize.x, this.scale.height / mapSize.y) * 0.92,
        DESKTOP_MIN_ZOOM,
        1
      );
    }

    const baseZoom = profile === "mobile-portrait" ? MOBILE_PORTRAIT_DEFAULT_ZOOM : MOBILE_LANDSCAPE_DEFAULT_ZOOM;
    return Phaser.Math.Clamp(baseZoom, MOBILE_MIN_ZOOM, MOBILE_MAX_ZOOM);
  }

  private startCenterForProfile(
    profile: CameraViewportProfile,
    mapSize: Phaser.Math.Vector2,
    zoom: number
  ): Phaser.Math.Vector2 {
    if (this.mode === "wildnis") {
      // Open on the player's forest camp; the lair stays hidden up north.
      const base = tileToWorld(getActiveMap().bases.player.anchor);
      return new Phaser.Math.Vector2(base.x, base.y);
    }

    if (profile === "desktop") {
      return new Phaser.Math.Vector2(mapSize.x / 2, mapSize.y / 2);
    }

    const visibleWidth = cameraVisibleWorldSize(this.cameras.main).x;
    const x = mapSize.x / 2;
    // TinyWar's playable battle lanes live in the upper half of the map while the lower half is mostly water.
    // Start slightly higher and, in portrait, a bit closer to avoid opening on dead space.
    const yFactor = profile === "mobile-portrait" ? 0.34 : 0.38;
    const center = new Phaser.Math.Vector2(x, mapSize.y * yFactor);
    const halfWidth = visibleWidth / 2;
    if (halfWidth >= mapSize.x * 0.5 && zoom < MOBILE_MAX_ZOOM) {
      return new Phaser.Math.Vector2(mapSize.x / 2, center.y);
    }

    return center;
  }

  private cameraCenterWorld(): Phaser.Math.Vector2 {
    const camera = this.cameras.main;
    return new Phaser.Math.Vector2(
      camera.scrollX + camera.width / (2 * camera.zoom),
      camera.scrollY + camera.height / (2 * camera.zoom)
    );
  }

  private spawnQueuedUnit(unitName: UnitName, color: PlayerColor, atPosition?: { x: number; y: number }): void {
    const renderer = new UnitRenderer(this);
    const base = this.buildings.find((building) => building.isBase && building.color === color);
    const enemyBase = this.buildings.find((building) => building.isBase && building.color !== color);
    const baseDoor = base ? getBuildingDoorSpawnPosition(base) : undefined;
    const spawnPosition = atPosition ?? baseDoor;
    const terminalPosition = enemyBase ? getBuildingDoorSpawnPosition(enemyBase) : undefined;
    // Original parity: each spawn places one unit on a random lane from the
    // direction's lane set, restricted to lanes that exist on the active map.
    const direction = color === "Blue" ? this.selectedDirection : "Any";
    const lane = randomLaneForDirection(direction, Math.random, getActiveMap().availableLanes);
    const unit = createLaneUnit(
      unitName,
      lane,
      0,
      `${color.toLowerCase()}-${this.spawnCounter}`,
      color,
      spawnPosition,
      terminalPosition
    );
    this.spawnCounter += 1;

    this.debugUnits.push(unit);
    this.debugUnitSprites.set(unit.id, renderer.renderUnit(unit, "Run"));
  }

  private playerSpeedBoost(): number {
    return this.boosts.active.some((boost) => boost.name === "Run") ? 2 : 1;
  }

  private chooseBoost(name: BoostName): void {
    if (this.paused || this.hud?.isWinnerVisible) {
      return;
    }
    const result = selectBoost(this.boosts, name);
    if (result.state === this.boosts) {
      return;
    }
    this.boosts = result.state;
    this.audio?.play("button");
    if (result.instant) {
      this.applyInstantBoost(result.instant);
    }
    this.hud?.updateBoosts(this.boosts);
  }

  private dismissBoostOffer(): void {
    this.boosts = skipOffer(this.boosts);
    this.audio?.play("click");
    this.hud?.updateBoosts(this.boosts);
  }

  private applyInstantBoost(name: BoostName): void {
    switch (name) {
      case "InstantHealing":
        this.debugUnits = applyInstantHealing(this.debugUnits, "Blue") as MovingUnit[];
        this.syncUnitHealth();
        break;
      case "Repair":
        this.buildings = applyRepair(this.buildings, "Blue") as BuildingInstance[];
        this.syncBuildingHealth();
        break;
      case "Lightning":
        this.debugUnits = applyLightning(this.debugUnits) as MovingUnit[];
        this.syncUnitHealth();
        break;
      case "InstantArmy":
        this.fulfilSpawnRequests(instantArmyRequests("Blue"));
        break;
      case "Clone":
        this.fulfilSpawnRequests(cloneRequests(this.debugUnits, "Blue"));
        break;
      case "Snakes":
        this.fulfilSpawnRequests(snakeSwarmRequests("Blue"));
        break;
      case "SpawnTrolls":
        this.fulfilSpawnRequests(trollRequests("Blue"));
        break;
      case "BearDefender":
        this.fulfilSpawnRequests(bearDefenderRequests(this.debugUnits, "Blue"));
        break;
      default:
        break;
    }
  }

  private fulfilSpawnRequests(requests: readonly SpawnRequest[]): void {
    for (const request of requests) {
      this.spawnQueuedUnit(request.unit, request.color, request.position);
    }
  }

  private syncUnitHealth(): void {
    for (const unit of this.debugUnits) {
      const handle = this.debugUnitSprites.get(unit.id);
      if (handle) {
        UnitRenderer.updateHandle(handle, unit, UnitRenderer.actionForUnit(unit));
      }
    }
  }

  private syncBuildingHealth(): void {
    for (const building of this.buildings) {
      const handle = this.buildingSprites.get(building.id);
      if (handle) {
        BuildingRenderer.updateHealth(handle, building);
      }
    }
  }

  private queueUnit(unitName: UnitName): void {
    if (this.paused || this.hud?.isUnitInfoVisible) {
      return;
    }

    if (!canAfford(this.playerGold, unitName)) {
      this.audio?.play("error");
      return;
    }

    const previousLength = this.queue.units.length;
    this.queue = enqueueUnit(this.queue, unitName);
    if (this.queue.units.length > previousLength) {
      this.playerGold = spendForUnit(this.playerGold, unitName).state;
      this.audio?.play("button");
      this.hud?.updateGold(this.playerGold);
    } else {
      this.audio?.play("error");
    }
    this.hud?.updateQueue(this.queue);
  }

  private cycleDirection(): void {
    if (this.paused || this.hud?.isUnitInfoVisible || getActiveMap().availableLanes.length <= 1) {
      return;
    }

    this.selectedDirection = nextDirection(this.selectedDirection);
    this.audio?.play("click");
    this.hud?.updateDirection(this.selectedDirection);
  }

  private selectStrategy(strategy: PlayerStrategy): void {
    if (this.paused || this.hud?.isUnitInfoVisible) {
      return;
    }

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

  private toggleUnitInfo(): void {
    this.hud?.toggleUnitInfo();
    this.cameraDrag?.setEnabled(!this.hud?.isUnitInfoVisible);
    this.audio?.play("click");
  }

  private togglePause(): void {
    if (this.hud?.isWinnerVisible) {
      return;
    }

    this.paused = !this.paused;
    this.hud?.updateSpeed(this.gameSpeed, this.paused);
  }

  private adjustGameSpeed(event: KeyboardEvent): void {
    if (!event.ctrlKey || this.hud?.isWinnerVisible) {
      return;
    }

    if (event.key === "ArrowRight") {
      this.gameSpeed = Math.min(MAX_GAME_SPEED, this.gameSpeed * 2);
    } else if (event.key === "ArrowLeft") {
      this.gameSpeed = Math.max(MIN_GAME_SPEED, this.gameSpeed * 0.5);
    } else {
      return;
    }

    this.hud?.updateSpeed(this.gameSpeed, this.paused);
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
