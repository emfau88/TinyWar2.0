import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

// Duel map: classic rules on a single lane. Two barracks on high plateaus
// (level 2, warm grass) face each other across a mid-level ring (level 1,
// deep green) and a sunken center arena (level 0, bright shore grass) with
// a decorative neutral village. Like the wildnis script, this file is the
// single source of truth: it emits the visual TMX and the gameplay layout.
//
// HEIGHTS legend: ~ water, 0/1/2 terrain elevation.
// WALKABLE legend: # walkable, . blocked (must stay on land, off cliff walls).
//
// Elevation rendering follows the hand-built classic map's grammar:
// level 0 uses the soft water-edge blob; levels 1/2 use the plateau family
// (grass edges 5-7/14-16/23-25, cliff wall 41-43 in the row below the south
// edge). Side transitions between levels are seamless grass-to-grass joins,
// exactly like the classic base ramps.

// Amphitheater layout: two high plateaus (2) in the north corners step down
// over visible stair cascades onto two separate mid-level approach roads (1),
// split in the middle by the north bay so there is exactly one meeting
// ground: the sunken center arena (0) with its village shoreline. All lane
// level changes run over STAIRS cascades (diagonal grass-over-cliff tiles),
// like the classic map's base ramps.
const HEIGHTS = [
  "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~",
  "~2222222~~~~~~~~~~~~~~2222222~",
  "~2222222~~~~~~~~~~~~~~2222222~",
  "~2222222~~~~~~~~~~~~~~2222222~",
  "~2222221~~~~~~~~~~~~~~1222222~",
  "~~111111~~~~~~~~~~~~~~111111~~",
  "~~11111111~~~~~~~~~~11111111~~",
  "~~11111111~~~~~~~~~~11111111~~",
  "~~00000000000000000000000000~~",
  "~~00000000000000000000000000~~",
  "~~~000000000000000000000000~~~",
  "~00~0000000000000000000000~00~",
  "~~~~0000000000000000000000~~~~",
  "~~~~~~000000000000000000~~~~~~",
  "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~",
  "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~"
];

// Stair cascades: the top cell renders the diagonal grass tile (39 right /
// 36 left), the cell below it the diagonal wall tile (48 / 45); both are
// walkable so the lane visibly climbs the cliff.
const STAIRS = [
  { x: 7, y: 3, side: "right" }, // blue plateau, upper step
  { x: 6, y: 4, side: "right" }, // blue plateau, lower step
  { x: 22, y: 3, side: "left" }, // red plateau, upper step
  { x: 23, y: 4, side: "left" }, // red plateau, lower step
  { x: 9, y: 7, side: "right" }, // west road down into the arena (at the bay)
  { x: 20, y: 7, side: "left" } // east road down into the arena
];

// Walkable corridor: door-to-door over the stair cascades, along the two
// approach roads and through the arena. Cliff-wall rows (the row south of
// every level edge) stay blocked; the south shore is the village strip.
const WALKABLE = [
  "..............................",
  "...#......................#...",
  "...#......................#...",
  "..######..............######..",
  "..######..............######..",
  "......##..............##......",
  "..########..........########..",
  "..########..........########..",
  ".........############.........",
  "...########################...",
  "....######################....",
  ".....####################.....",
  "......##################......",
  "..............................",
  "..............................",
  ".............................."
];

const WIDTH = HEIGHTS[0].length;
const HEIGHT = HEIGHTS.length;

// Gameplay anchors, mirroring classic (anchor on the plateau, door two south).
const PLAYER_BASE_ANCHOR = { x: 3, y: 1 };
const PLAYER_DOOR = { x: 3, y: 3 };
const PLAYER_ROOF = { x: 3, y: 2 };
const OPPONENT_BASE_ANCHOR = { x: 26, y: 1 };
const OPPONENT_DOOR = { x: 26, y: 3 };
const OPPONENT_ROOF = { x: 26, y: 2 };
// Door -> down the plateau stairs -> approach road -> arena stairs at the
// bay -> village arena -> mirrored climb on the east side.
const LANE_WAYPOINTS = [
  { x: 6, y: 3 },
  { x: 7, y: 4 },
  { x: 7, y: 6 },
  { x: 9, y: 7 },
  { x: 9, y: 8 },
  { x: 11, y: 10 },
  { x: 14, y: 11 },
  { x: 18, y: 10 },
  { x: 20, y: 8 },
  { x: 20, y: 7 },
  { x: 22, y: 6 },
  { x: 22, y: 4 },
  { x: 23, y: 3 }
];

// Tile ids inside each 54-tile grass tileset (9 columns, 0-based), learned
// from the classic map: left block = soft water-edge blob, right block =
// plateau edges with cliff walls.
const BLOB = {
  topLeft: 0,
  top: 1,
  topRight: 2,
  left: 9,
  fill: 10,
  right: 11,
  bottomLeft: 18,
  bottom: 19,
  bottomRight: 20,
  stripTop: 3,
  stripVMid: 12,
  stripBottom: 21,
  stripLeft: 27,
  stripMid: 28,
  stripRight: 29,
  island: 30
};

const PLATEAU = {
  topLeft: 5,
  top: 6,
  topRight: 7,
  left: 14,
  fill: 15,
  right: 16,
  bottomLeft: 23,
  bottom: 24,
  bottomRight: 25,
  wallLeft: 41,
  wall: 42,
  wallRight: 43,
  // Wall-foot row with the bright bottom outline, used where the wall meets
  // open water (like the classic plateaus falling into the sea).
  wallFootLeft: 50,
  wallFoot: 51,
  wallFootRight: 52,
  // Stair diagonals: grass running out over the cliff (top) and the matching
  // wall piece below - the classic map's walkable ramp look.
  stairTopLeft: 36,
  stairTopRight: 39,
  stairWallLeft: 45,
  stairWallRight: 48
};

// First gids copied from the original map.tmx tileset table.
const GID = {
  brightGrass: 1, // tiles1 / Tilemap_color3 (bright, level 0)
  warmGrass: 55, // tiles1 / Tilemap_color1 (warm, level 2)
  deepGrass: 109, // tiles2 / Tilemap_color2 (deep green, level 1)
  foam: 163,
  waterRocks1: 179,
  waterRocks2: 195,
  rock4: 211,
  rock1: 212,
  bushe2: 213,
  bushe4: 221,
  tree1: 229,
  tree3: 237,
  sheep: 245,
  tree2: 251,
  bushe1: 259,
  stump1: 267,
  bushe3: 279,
  waterRocks3: 287,
  waterRocks4: 303,
  stump3: 319
};

// Decorative neutral buildings (unused assets), appended as one-tile tilesets.
const BUILDING_TILESETS = [
  { gid: 400, name: "deco-house1", image: "../images/buildings/Black/House1.png", w: 128, h: 192 },
  { gid: 401, name: "deco-house2", image: "../images/buildings/Black/House2.png", w: 128, h: 192 },
  { gid: 402, name: "deco-house3", image: "../images/buildings/Black/House3.png", w: 128, h: 192 },
  { gid: 403, name: "deco-monastery", image: "../images/buildings/Black/Monastery.png", w: 192, h: 320 },
  { gid: 404, name: "deco-archery", image: "../images/buildings/Black/Archery.png", w: 192, h: 256 }
];

// anchor tile = bottom-left of the sprite (Tiled convention). All buildings
// line the blocked south shore below the village meadow.
const BUILDING_SPOTS = [
  { gid: 404, x: 6, y: 13 }, // archery range, west end of the shore
  { gid: 400, x: 10, y: 13 }, // village houses
  { gid: 401, x: 12, y: 13 },
  { gid: 402, x: 16, y: 13 },
  { gid: 403, x: 20, y: 13 } // monastery, east end of the shore
];

const projectRoot = resolve(import.meta.dirname, "..");
const originalTmxPath = resolve(projectRoot, "public/assets/tinywar/map/map.tmx");
const tmxOutPath = resolve(projectRoot, "public/assets/tinywar/map/duel.tmx");
const layoutOutPath = resolve(projectRoot, "src/core/map/generated/duelMapLayout.ts");

function heightAt(x, y) {
  if (x < 0 || y < 0 || x >= WIDTH || y >= HEIGHT) {
    return -1;
  }
  const c = HEIGHTS[y][x];
  return c === "~" ? -1 : Number(c);
}

const isLand = (x, y) => heightAt(x, y) >= 0;
const isWalkable = (x, y) =>
  x >= 0 && y >= 0 && x < WIDTH && y < HEIGHT && WALKABLE[y][x] === "#";

// ---------------------------------------------------------------------------
// Validation: catch broken geometry at build time, not in the game.
// ---------------------------------------------------------------------------
const errors = [];

for (const [name, grid] of [["HEIGHTS", HEIGHTS], ["WALKABLE", WALKABLE]]) {
  if (grid.length !== HEIGHT) errors.push(`${name} has ${grid.length} rows, expected ${HEIGHT}.`);
  grid.forEach((row, y) => {
    if (row.length !== WIDTH) errors.push(`${name} row ${y} has length ${row.length}, expected ${WIDTH}.`);
  });
}

for (let y = 0; y < HEIGHT; y += 1) {
  for (let x = 0; x < WIDTH; x += 1) {
    const h = heightAt(x, y);
    // No orthogonal level jumps by 2 (0 next to 2) - the tileset has no art for it.
    for (const [dx, dy] of [[1, 0], [0, 1]]) {
      const other = heightAt(x + dx, y + dy);
      if (h >= 0 && other >= 0 && Math.abs(h - other) > 1) {
        errors.push(`Height jump ${h}->${other} at ${x},${y} -> ${x + dx},${y + dy}.`);
      }
    }
    // Plateau cells need a full edge row: no 1-tile-high strips on levels 1/2.
    if (h >= 1) {
      const above = heightAt(x, y - 1) >= h;
      const below = heightAt(x, y + 1) >= h;
      if (!above && !below) errors.push(`1-tile-high level-${h} strip at ${x},${y}.`);
    }
    // Walkable must be on land and never on a cliff-wall tile (the cell south
    // of a higher level's south edge) - unless a stair cascade sits there.
    if (isWalkable(x, y)) {
      if (!isLand(x, y)) errors.push(`Walkable on water at ${x},${y}.`);
      const stairAbove = STAIRS.some((s) => s.x === x && s.y === y - 1);
      if (heightAt(x, y - 1) > heightAt(x, y) && !stairAbove) {
        errors.push(`Walkable on cliff wall at ${x},${y}.`);
      }
    }
  }
}

// Stairs must sit on a south edge of their level, with walkable ramp cells.
for (const stair of STAIRS) {
  const h = heightAt(stair.x, stair.y);
  if (h < 1) errors.push(`Stair at ${stair.x},${stair.y} is not on an elevated level.`);
  if (heightAt(stair.x, stair.y + 1) >= h) {
    errors.push(`Stair at ${stair.x},${stair.y} is not on a south edge.`);
  }
  if (!isLand(stair.x, stair.y + 1)) {
    errors.push(`Stair at ${stair.x},${stair.y} runs into water.`);
  }
}

// The lane must be connected door to door across walkable tiles.
function bfsReachable(from) {
  const seen = new Set([`${from.x},${from.y}`]);
  const queue = [from];
  while (queue.length > 0) {
    const { x, y } = queue.shift();
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx;
      const ny = y + dy;
      const key = `${nx},${ny}`;
      if (!seen.has(key) && isWalkable(nx, ny)) {
        seen.add(key);
        queue.push({ x: nx, y: ny });
      }
    }
  }
  return seen;
}

const reachable = bfsReachable(PLAYER_DOOR);
for (const point of [OPPONENT_DOOR, ...LANE_WAYPOINTS]) {
  if (!reachable.has(`${point.x},${point.y}`)) {
    errors.push(`Lane point ${point.x},${point.y} is not reachable from the player door.`);
  }
}

if (errors.length > 0) {
  console.error("Duel map validation failed:");
  for (const error of errors) console.error(`  - ${error}`);
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Tile layers.
// ---------------------------------------------------------------------------
function blobAutotile(inMask, x, y) {
  const n = inMask(x, y - 1);
  const s = inMask(x, y + 1);
  const w = inMask(x - 1, y);
  const e = inMask(x + 1, y);

  if (!w && !e) {
    if (!n && !s) return BLOB.island;
    if (!n) return BLOB.stripTop;
    if (!s) return BLOB.stripBottom;
    return BLOB.stripVMid;
  }
  if (!n && !s) {
    if (!w) return BLOB.stripLeft;
    if (!e) return BLOB.stripRight;
    return BLOB.stripMid;
  }
  if (!n) {
    if (!w) return BLOB.topLeft;
    if (!e) return BLOB.topRight;
    return BLOB.top;
  }
  if (!s) {
    if (!w) return BLOB.bottomLeft;
    if (!e) return BLOB.bottomRight;
    return BLOB.bottom;
  }
  if (!w) return BLOB.left;
  if (!e) return BLOB.right;
  return BLOB.fill;
}

function plateauAutotile(inMask, x, y) {
  const n = inMask(x, y - 1);
  const s = inMask(x, y + 1);
  const w = inMask(x - 1, y);
  const e = inMask(x + 1, y);

  if (!n) {
    if (!w) return PLATEAU.topLeft;
    if (!e) return PLATEAU.topRight;
    return PLATEAU.top;
  }
  if (!s) {
    if (!w) return PLATEAU.bottomLeft;
    if (!e) return PLATEAU.bottomRight;
    return PLATEAU.bottom;
  }
  if (!w) return PLATEAU.left;
  if (!e) return PLATEAU.right;
  return PLATEAU.fill;
}

// Level 0: soft blob against water, bright grass, everywhere there is land.
function buildGroundLayer() {
  const data = new Array(WIDTH * HEIGHT).fill(0);
  for (let y = 0; y < HEIGHT; y += 1) {
    for (let x = 0; x < WIDTH; x += 1) {
      if (isLand(x, y)) {
        data[y * WIDTH + x] = GID.brightGrass + blobAutotile(isLand, x, y);
      }
    }
  }
  return data;
}

// Levels 1 and 2: plateau family plus the cliff wall in the row below the
// south edge, with stair-diagonal overrides at the cascade cells.
function buildLevelLayer(level, firstGid) {
  const inMask = (x, y) => heightAt(x, y) >= level;
  const stairAt = (x, y) => STAIRS.find((s) => s.x === x && s.y === y && heightAt(x, y) === level);
  const data = new Array(WIDTH * HEIGHT).fill(0);
  for (let y = 0; y < HEIGHT; y += 1) {
    for (let x = 0; x < WIDTH; x += 1) {
      if (inMask(x, y)) {
        const stair = stairAt(x, y);
        data[y * WIDTH + x] =
          firstGid +
          (stair
            ? stair.side === "right"
              ? PLATEAU.stairTopRight
              : PLATEAU.stairTopLeft
            : plateauAutotile(inMask, x, y));
      } else if (inMask(x, y - 1)) {
        // Cliff wall hanging from the south edge above; a stair above turns
        // it into the diagonal ramp piece, water below into the outlined
        // wall-foot row.
        const stairAbove = stairAt(x, y - 1);
        if (stairAbove) {
          data[y * WIDTH + x] =
            firstGid + (stairAbove.side === "right" ? PLATEAU.stairWallRight : PLATEAU.stairWallLeft);
          continue;
        }
        const wallW = inMask(x - 1, y - 1) && !inMask(x - 1, y);
        const wallE = inMask(x + 1, y - 1) && !inMask(x + 1, y);
        const foot = !isLand(x, y);
        const id = !wallW
          ? foot ? PLATEAU.wallFootLeft : PLATEAU.wallLeft
          : !wallE
            ? foot ? PLATEAU.wallFootRight : PLATEAU.wallRight
            : foot ? PLATEAU.wallFoot : PLATEAU.wall;
        data[y * WIDTH + x] = firstGid + id;
      }
    }
  }
  return data;
}

// Deterministic pseudo-random for reproducible decoration placement.
function hash(x, y, salt) {
  let h = (x * 374761393 + y * 668265263 + salt * 2147483647) | 0;
  h = (h ^ (h >> 13)) * 1274126177;
  return ((h ^ (h >> 16)) >>> 0) / 4294967296;
}

function buildFoamLayer() {
  const data = new Array(WIDTH * HEIGHT).fill(0);
  for (let y = 0; y < HEIGHT; y += 1) {
    for (let x = 0; x < WIDTH; x += 1) {
      if (!isLand(x, y)) continue;
      const touchesWater =
        !isLand(x, y - 1) || !isLand(x, y + 1) || !isLand(x - 1, y) || !isLand(x + 1, y);
      if (touchesWater && (x + y) % 2 === 0) {
        data[y * WIDTH + x] = GID.foam;
      }
    }
  }
  return data;
}

const buildingCells = new Set();
for (const spot of BUILDING_SPOTS) {
  const ts = BUILDING_TILESETS.find((t) => t.gid === spot.gid);
  const cols = Math.ceil(ts.w / 64);
  for (let dx = 0; dx < cols; dx += 1) {
    buildingCells.add(`${spot.x + dx},${spot.y}`);
    buildingCells.add(`${spot.x + dx},${spot.y - 1}`);
  }
}

// A tree canopy is ~3x3 above its anchor; keep it off the lane and buildings.
function canopyClear(x, y) {
  for (let dy = 0; dy <= 3; dy += 1) {
    for (let dx = 0; dx <= 2; dx += 1) {
      if (isWalkable(x + dx, y - dy) || buildingCells.has(`${x + dx},${y - dy}`)) {
        return false;
      }
    }
  }
  return true;
}

function buildDecorationLayer() {
  const data = new Array(WIDTH * HEIGHT).fill(0);
  const bushes = [GID.bushe1, GID.bushe2, GID.bushe3, GID.bushe4];
  const waterRocks = [GID.waterRocks1, GID.waterRocks2, GID.waterRocks3, GID.waterRocks4];
  const trees = [GID.tree1, GID.tree2, GID.tree3];

  for (let y = 0; y < HEIGHT; y += 1) {
    for (let x = 0; x < WIDTH; x += 1) {
      const key = `${x},${y}`;
      if (buildingCells.has(key)) continue;

      // Decoration only sits on fill cells (all four neighbours on the same
      // level) so nothing ever overlaps an edge or cliff tile.
      const h = heightAt(x, y);
      const isFill =
        isLand(x, y) &&
        heightAt(x, y - 1) === h &&
        heightAt(x, y + 1) === h &&
        heightAt(x - 1, y) === h &&
        heightAt(x + 1, y) === h;

      // Blocked meadows get trees (where the canopy fits) or bushes.
      if (isFill && !isWalkable(x, y)) {
        if (canopyClear(x, y) && hash(x, y, 1) < 0.62) {
          data[y * WIDTH + x] = trees[Math.floor(hash(x, y, 2) * trees.length)];
          continue;
        }
        if (hash(x, y, 3) < 0.42) {
          data[y * WIDTH + x] = bushes[Math.floor(hash(x, y, 4) * bushes.length)];
          continue;
        }
      }

      // Occasional rocks, stumps and small bushes on open walkable meadows.
      if (isFill && isWalkable(x, y) && hash(x, y, 5) < 0.065) {
        const roll = hash(x, y, 6);
        data[y * WIDTH + x] =
          roll < 0.35 ? GID.rock1 : roll < 0.7 ? GID.stump1 : bushes[Math.floor(hash(x, y, 11) * bushes.length)];
        continue;
      }

      // Animated water rocks offshore.
      if (!isLand(x, y) && hash(x, y, 7) < 0.05) {
        const nearLand = isLand(x - 1, y) || isLand(x + 1, y) || isLand(x, y - 1) || isLand(x, y + 1);
        if (!nearLand) {
          data[y * WIDTH + x] = waterRocks[Math.floor(hash(x, y, 8) * waterRocks.length)];
        }
      }
    }
  }

  // Sheep grazing next to the village.
  for (const spot of [{ x: 9, y: 12 }, { x: 15, y: 12 }, { x: 19, y: 12 }]) {
    if (isLand(spot.x, spot.y) && !buildingCells.has(`${spot.x},${spot.y}`)) {
      data[spot.y * WIDTH + spot.x] = GID.sheep;
    }
  }

  return data;
}

function buildBuildingLayer() {
  const data = new Array(WIDTH * HEIGHT).fill(0);
  for (const spot of BUILDING_SPOTS) {
    data[spot.y * WIDTH + spot.x] = spot.gid;
  }
  return data;
}

function csv(data) {
  const rows = [];
  for (let y = 0; y < HEIGHT; y += 1) {
    rows.push(data.slice(y * WIDTH, (y + 1) * WIDTH).join(","));
  }
  return rows.join(",\n");
}

// Reuse the original tileset table verbatim, then append the building decor.
const originalXml = readFileSync(originalTmxPath, "utf8");
const tilesetStart = originalXml.indexOf("<tileset");
const tilesetEnd = originalXml.lastIndexOf("</tileset>") + "</tileset>".length;
const tilesetXml = originalXml.slice(tilesetStart, tilesetEnd);

const buildingTilesetXml = BUILDING_TILESETS.map(
  (t) => ` <tileset firstgid="${t.gid}" name="${t.name}" tilewidth="${t.w}" tileheight="${t.h}" tilecount="1" columns="1">
  <image source="${t.image}" width="${t.w}" height="${t.h}"/>
 </tileset>`
).join("\n");

const layers = [
  { id: 1, name: "foam", data: buildFoamLayer() },
  { id: 2, name: "ground", data: buildGroundLayer() },
  { id: 3, name: "level1", data: buildLevelLayer(1, GID.deepGrass) },
  { id: 4, name: "level2", data: buildLevelLayer(2, GID.warmGrass) },
  { id: 5, name: "buildings", data: buildBuildingLayer() },
  { id: 6, name: "deco", data: buildDecorationLayer() }
];

const layerXml = layers
  .map(
    (layer) => ` <layer id="${layer.id}" name="${layer.name}" width="${WIDTH}" height="${HEIGHT}">
  <data encoding="csv">
${csv(layer.data)}
</data>
 </layer>`
  )
  .join("\n");

const tmx = `<?xml version="1.0" encoding="UTF-8"?>
<map version="1.10" tiledversion="1.11.2" orientation="orthogonal" renderorder="right-down" width="${WIDTH}" height="${HEIGHT}" tilewidth="64" tileheight="64" infinite="0" nextlayerid="7" nextobjectid="1">
 ${tilesetXml}
${buildingTilesetXml}
${layerXml}
</map>
`;

writeFileSync(tmxOutPath, tmx, "utf8");

const layoutTs = `// Generated by scripts/generate-duel-map.mjs - do not edit by hand.
import type { TilePosition } from "../mapGeometry";

export const DUEL_SIZE = { width: ${WIDTH}, height: ${HEIGHT} } as const;

export const DUEL_WALKABLE: readonly string[] = ${JSON.stringify(WALKABLE, null, 2)};

export const DUEL_PLAYER_BASE_ANCHOR: TilePosition = ${JSON.stringify(PLAYER_BASE_ANCHOR)};
export const DUEL_PLAYER_DOOR: TilePosition = ${JSON.stringify(PLAYER_DOOR)};
export const DUEL_PLAYER_ROOF: TilePosition = ${JSON.stringify(PLAYER_ROOF)};
export const DUEL_OPPONENT_BASE_ANCHOR: TilePosition = ${JSON.stringify(OPPONENT_BASE_ANCHOR)};
export const DUEL_OPPONENT_DOOR: TilePosition = ${JSON.stringify(OPPONENT_DOOR)};
export const DUEL_OPPONENT_ROOF: TilePosition = ${JSON.stringify(OPPONENT_ROOF)};
export const DUEL_LANE_WAYPOINTS: readonly TilePosition[] = ${JSON.stringify(LANE_WAYPOINTS)};
`;

mkdirSync(dirname(layoutOutPath), { recursive: true });
writeFileSync(layoutOutPath, layoutTs, "utf8");

console.log(`Wrote ${tmxOutPath}`);
console.log(`Wrote ${layoutOutPath}`);
