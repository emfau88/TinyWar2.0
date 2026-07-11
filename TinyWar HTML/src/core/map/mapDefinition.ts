import type { TilePosition } from "./mapGeometry";

export type MapId = "classic" | "duel" | "wildnis";

export type LaneName = "Top" | "Mid" | "Bot";

export interface BaseSetup {
  /** Matches BuildingName in buildingData; kept as string to avoid a core import cycle. */
  building: "Barracks" | "Castle" | "Tower";
  color: "Black" | "Blue" | "Purple" | "Red" | "Yellow";
  /** Building anchor tile (equals the map's path start/end). */
  anchor: TilePosition;
  /** Tile where spawned units appear and melee attackers strike. */
  door: TilePosition;
  /** Tiles for stationed roof defenders; empty for undefended bases. */
  roofDefenders: readonly TilePosition[];
}

export interface MapDefinition {
  id: MapId;
  size: { width: number; height: number };
  /**
   * One string per tile row, "#" walkable, "." blocked.
   * Every row must be exactly `size.width` characters long.
   */
  walkable: readonly string[];
  /** Ordered waypoints per lane; the lane path runs start -> waypoints -> end. */
  lanes: Readonly<Partial<Record<LaneName, readonly TilePosition[]>>>;
  /** Lanes that exist on this map. Classic has three, Wildnis a single one. */
  availableLanes: readonly LaneName[];
  /** Path endpoints (also the two base tiles: player first, opponent second). */
  start: TilePosition;
  end: TilePosition;
  bases: {
    player: BaseSetup;
    opponent: BaseSetup;
  };
}

export const CLASSIC_MAP: MapDefinition = {
  id: "classic",
  size: { width: 30, height: 16 },
  walkable: [
    "...#.......................#..",
    "..#######....####......######.",
    "..########.######.....#######.",
    "..##########....##...###..###.",
    "..####......####.#####..#####.",
    "...##############.....#######.",
    "......##....##############....",
    "...######.##.########..#####..",
    "........#####..##....##.####..",
    "....###########..##########...",
    "....############.#######......",
    "...####...##..###########.....",
    "...####........######.###.....",
    "...............#####..........",
    "...............####...........",
    ".............................."
  ],
  lanes: {
    Top: [{ x: 14, y: 2 }],
    Mid: [{ x: 14, y: 6 }],
    Bot: [{ x: 14, y: 10 }]
  },
  availableLanes: ["Top", "Mid", "Bot"],
  start: { x: 3, y: 0 },
  end: { x: 27, y: 0 },
  bases: {
    player: {
      building: "Barracks",
      color: "Blue",
      anchor: { x: 3, y: 0 },
      door: { x: 3, y: 2 },
      roofDefenders: [
        { x: 3, y: 1 },
        { x: 3, y: 1 }
      ]
    },
    opponent: {
      building: "Barracks",
      color: "Red",
      anchor: { x: 27, y: 0 },
      door: { x: 27, y: 2 },
      roofDefenders: [
        { x: 27, y: 1 },
        { x: 27, y: 1 }
      ]
    }
  }
};

export function assertValidMapDefinition(map: MapDefinition): void {
  if (map.walkable.length !== map.size.height) {
    throw new Error(`Map ${map.id}: walkable has ${map.walkable.length} rows, expected ${map.size.height}.`);
  }

  for (const [index, row] of map.walkable.entries()) {
    if (row.length !== map.size.width) {
      throw new Error(`Map ${map.id}: walkable row ${index} has length ${row.length}, expected ${map.size.width}.`);
    }
  }

  for (const lane of map.availableLanes) {
    if (!map.lanes[lane] || map.lanes[lane]!.length === 0) {
      throw new Error(`Map ${map.id}: lane ${lane} has no waypoints.`);
    }
  }
}
