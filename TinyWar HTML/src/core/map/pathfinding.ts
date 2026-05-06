import {
  MAP_SIZE,
  type TilePosition,
  tileToWorld,
  type WorldPosition
} from "./mapGeometry";

export type LaneName = "Top" | "Mid" | "Bot";

const WALKABLE_BITS = [
  0b000100000000000000000000000100,
  0b001111111000011110000001111110,
  0b001111111101111110000011111110,
  0b001111111111000011000111001110,
  0b001111000000111101111100111110,
  0b000111111111111110000011111110,
  0b000000110000111111111111110000,
  0b000111111011011111111001111100,
  0b000000001111100110000110111100,
  0b000011111111111001111111111000,
  0b000011111111111101111111000000,
  0b000111100011001111111111100000,
  0b000111100000000111111011100000,
  0b000000000000000111110000000000,
  0b000000000000000111100000000000,
  0b000000000000000000000000000000
] as const;

const LANE_WAYPOINTS: Record<LaneName, TilePosition> = {
  Top: { x: 14, y: 2 },
  Mid: { x: 14, y: 6 },
  Bot: { x: 14, y: 10 }
};

const START = { x: 3, y: 0 } as const;
const END = { x: 27, y: 0 } as const;

export function isWalkable(tile: TilePosition): boolean {
  if (tile.x < 0 || tile.y < 0 || tile.x >= MAP_SIZE.width || tile.y >= MAP_SIZE.height) {
    return false;
  }

  return (WALKABLE_BITS[tile.y] & (1 << (MAP_SIZE.width - 1 - tile.x))) !== 0;
}

export function getLanePath(lane: LaneName): readonly TilePosition[] {
  const firstSegment = findPath(START, LANE_WAYPOINTS[lane]);
  const secondSegment = findPath(LANE_WAYPOINTS[lane], END).slice(1);

  return [...firstSegment, ...secondSegment];
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
  return Math.abs(START.x - tile.x) + Math.abs(START.y - tile.y) + Math.abs(end.x - tile.x);
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
