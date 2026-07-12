import { getActiveMap } from "./activeMap";
import { tileToWorld, type TilePosition, type WorldPosition } from "./mapGeometry";

export type { LaneName } from "./mapDefinition";
import type { LaneName } from "./mapDefinition";

export function isWalkable(tile: TilePosition): boolean {
  const map = getActiveMap();
  if (tile.x < 0 || tile.y < 0 || tile.x >= map.size.width || tile.y >= map.size.height) {
    return false;
  }

  return map.walkable[tile.y][tile.x] === "#";
}

export function getLanePath(lane: LaneName): readonly TilePosition[] {
  const map = getActiveMap();
  const waypoints = map.lanes[lane];
  if (!waypoints || waypoints.length === 0) {
    throw new Error(`Map ${map.id} has no lane ${lane}.`);
  }

  const stops = [map.start, ...waypoints, map.end];
  const path: TilePosition[] = [];
  for (let index = 0; index < stops.length - 1; index += 1) {
    const segment = findPath(stops[index], stops[index + 1]);
    path.push(...(index === 0 ? segment : segment.slice(1)));
  }

  return path;
}

export function getLaneWorldPath(lane: LaneName): readonly WorldPosition[] {
  return getLanePath(lane).map(tileToWorld);
}

export function findPath(start: TilePosition, end: TilePosition): readonly TilePosition[] {
  const open = new Map<string, PathNode>();
  const closed = new Set<string>();
  const startKey = key(start);
  open.set(startKey, {
    tile: start,
    g: 0,
    f: heuristic(start, end)
  });

  while (open.size > 0) {
    const current = [...open.values()].sort((a, b) => a.f - b.f || a.g - b.g)[0];
    const currentKey = key(current.tile);

    if (sameTile(current.tile, end)) {
      return reconstruct(current);
    }

    open.delete(currentKey);
    closed.add(currentKey);

    for (const neighbor of neighbors(current.tile)) {
      const neighborKey = key(neighbor);
      if (closed.has(neighborKey)) {
        continue;
      }

      const g = current.g + 1;
      const existing = open.get(neighborKey);
      if (existing && g >= existing.g) {
        continue;
      }

      open.set(neighborKey, {
        tile: neighbor,
        g,
        f: g + heuristic(neighbor, end),
        parent: current
      });
    }
  }

  throw new Error(`Unable to find path from ${key(start)} to ${key(end)}.`);
}

function stairKind(tile: TilePosition): "top" | "wall" | undefined {
  const map = getActiveMap();
  if (map.stairWalls?.some((stair) => sameTile(stair, tile))) {
    return "wall";
  }
  if (map.stairTops?.some((stair) => sameTile(stair, tile))) {
    return "top";
  }
  return undefined;
}

function neighbors(tile: TilePosition): TilePosition[] {
  const moves = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
    [-1, -1],
    [-1, 1],
    [1, -1],
    [1, 1]
  ];

  return moves.flatMap(([dx, dy]) => {
    const next = { x: tile.x + dx, y: tile.y + dy };
    if (!isWalkable(next)) {
      return [];
    }

    // Stair ramps are climbed head-on, not cut across: no diagonal step may
    // touch a stair cell. That alone keeps units walking the steps straight
    // up/down while still allowing a flat horizontal step at the foot, so the
    // lane doesn't dip an extra tile and zig-zag when crossing past a stair.
    const kinds = [stairKind(tile), stairKind(next)];
    if (kinds.some((kind) => kind !== undefined) && dx !== 0 && dy !== 0) {
      return [];
    }

    if (dx !== 0 && dy !== 0) {
      const horizontal = { x: tile.x + dx, y: tile.y };
      const vertical = { x: tile.x, y: tile.y + dy };
      if (!isWalkable(horizontal) || !isWalkable(vertical)) {
        return [];
      }
    }

    return [next];
  });
}

function heuristic(tile: TilePosition, end: TilePosition): number {
  // Matches the original heuristic exactly (it anchors on the map start for
  // every segment) so classic lane shapes stay identical after the refactor.
  const mapStart = getActiveMap().start;
  return Math.abs(mapStart.x - tile.x) + Math.abs(mapStart.y - tile.y) + Math.abs(end.x - tile.x);
}

function reconstruct(node: PathNode): TilePosition[] {
  const path: TilePosition[] = [];
  let current: PathNode | undefined = node;

  while (current) {
    path.unshift(current.tile);
    current = current.parent;
  }

  return path;
}

function sameTile(a: TilePosition, b: TilePosition): boolean {
  return a.x === b.x && a.y === b.y;
}

function key(tile: TilePosition): string {
  return `${tile.x},${tile.y}`;
}

interface PathNode {
  tile: TilePosition;
  g: number;
  f: number;
  parent?: PathNode;
}
