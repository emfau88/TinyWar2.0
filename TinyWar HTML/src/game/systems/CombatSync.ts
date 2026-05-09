import { resolveCombat } from "../../core/combat/combatSystem";
import type { ProjectileInstance } from "../../core/combat/projectileSystem";
import {
  getBuildingCombatPosition,
  type BuildingInstance
} from "../../core/buildings/buildingData";
import type { MovingUnit } from "../../core/movement/movementSystem";
import type { PlayerStrategy } from "../../core/player/playerStrategy";
import { BuildingRenderer, type BuildingRenderHandle } from "../render/BuildingRenderer";
import { ProjectileRenderer, type ProjectileRenderHandle } from "../render/ProjectileRenderer";
import { UnitRenderer, type UnitRenderHandle } from "../render/UnitRenderer";

export interface CombatSyncState {
  units: MovingUnit[];
  buildings: BuildingInstance[];
  projectiles: ProjectileInstance[];
  unitHandles: Map<string, UnitRenderHandle>;
  buildingHandles: Map<string, BuildingRenderHandle>;
  projectileHandles: Map<string, ProjectileRenderHandle>;
  projectileRenderer: ProjectileRenderer;
  strategies?: {
    Blue?: PlayerStrategy;
    Red?: PlayerStrategy;
  };
  winner?: "Blue" | "Red";
}

export function resolveAndSyncCombat(state: CombatSyncState, deltaMs: number): CombatSyncState {
  const combat = resolveCombat(
    {
      units: state.units,
      buildings: state.buildings,
      projectiles: state.projectiles,
      strategies: state.strategies
    },
    deltaMs
  );

  const units = state.units
    .flatMap((unit) => {
      const combatUnit = combat.units.find((candidate) => candidate.id === unit.id);
      return combatUnit
        ? [
            {
              ...unit,
              health: combatUnit.health,
              attackCooldownMs: combatUnit.attackCooldownMs,
              moving: combatUnit.moving,
              guarding: combatUnit.guarding,
              targetId: combatUnit.targetId,
              targetKind: combatUnit.targetKind
            }
          ]
        : [];
    });

  syncUnitHandles(units, combat.buildings, state.unitHandles);
  syncBuildingHandles(combat.buildings, state.buildingHandles);
  syncProjectileHandles(combat.projectiles ?? [], state.projectileHandles, state.projectileRenderer);

  return {
    ...state,
    units,
    buildings: [...combat.buildings],
    projectiles: [...(combat.projectiles ?? [])],
    winner: combat.winner
  };
}

function syncUnitHandles(
  units: readonly MovingUnit[],
  buildings: readonly BuildingInstance[],
  handles: Map<string, UnitRenderHandle>
): void {
  const liveUnitIds = new Set(units.map((unit) => unit.id));
  for (const [id, handle] of handles) {
    if (!liveUnitIds.has(id)) {
      UnitRenderer.destroyHandle(handle);
      handles.delete(id);
    }
  }

  for (const unit of units) {
    const handle = handles.get(unit.id);
    if (handle) {
      UnitRenderer.updateHandle(handle, unit, UnitRenderer.actionForUnit(unit), targetPosition(unit, units, buildings));
    }
  }
}

function targetPosition(
  unit: MovingUnit,
  units: readonly MovingUnit[],
  buildings: readonly BuildingInstance[]
): { x: number; y: number } | undefined {
  if (unit.targetKind === "unit" && unit.targetId) {
    return units.find((candidate) => candidate.id === unit.targetId)?.position;
  }

  if (unit.targetKind === "building" && unit.targetId) {
    const building = buildings.find((candidate) => candidate.id === unit.targetId);
    return building ? getBuildingCombatPosition(building) : undefined;
  }

  return undefined;
}

function syncBuildingHandles(
  buildings: readonly BuildingInstance[],
  handles: Map<string, BuildingRenderHandle>
): void {
  for (const building of buildings) {
    const handle = handles.get(building.id);
    if (handle) {
      BuildingRenderer.updateHealth(handle, building);
    }
  }
}

function syncProjectileHandles(
  projectiles: readonly ProjectileInstance[],
  handles: Map<string, ProjectileRenderHandle>,
  renderer: ProjectileRenderer
): void {
  const liveProjectileIds = new Set(projectiles.map((projectile) => projectile.id));
  for (const [id, handle] of handles) {
    if (!liveProjectileIds.has(id)) {
      ProjectileRenderer.destroyHandle(handle);
      handles.delete(id);
    }
  }

  for (const projectile of projectiles) {
    const handle = handles.get(projectile.id);
    if (handle) {
      ProjectileRenderer.updateHandle(handle, projectile);
    } else {
      handles.set(projectile.id, renderer.renderProjectile(projectile));
    }
  }
}
