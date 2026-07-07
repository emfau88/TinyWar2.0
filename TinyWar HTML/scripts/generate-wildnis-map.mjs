import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

// Wildnis map: one long winding forest lane from the player's barracks
// (bottom left) to the black monster castle (top right). This script is the
// single source of truth: it emits both the visual TMX and the gameplay
// layout (walkable grid + lane waypoints), so they can never drift apart.
//
// Legend:
//   ~  water
//   #  walkable grass (the lane corridor and meadows)
//   F  forest: grass ground, blocked, tree/bush decorations
//   C  castle grounds: grass ground, blocked, kept free of trees
//   B  player base anchor (walkable)
//   L  lair (castle) anchor (blocked, part of castle grounds)
//   o  small decorative islet (grass, blocked, bushes only)
const LAYOUT = [
  "~~~~~~~~~~~~~~~~~~~~~~",
  "~~~FFFFFFFFFFCCCCCF~~~",
  "~~FFFFFFFFFFFCCLCCF~~~",
  "~~FFFFFFFFFFFCCCCCF~~~",
  "~~FF#############FF~~~",
  "~~FF#############F~oo~",
  "~~FF###FFFFFFFFFFF~~~~",
  "~~FF###FFFFF~~~oo~~~~~",
  "~~FF###FFFFFF~~oo~~~~~",
  "~~FF##############F~~~",
  "~~FF##############F~~~",
  "~~FFFFFFFFFFFF####F~~~",
  "~~~FFFFFFFFFF####FF~~~",
  "~~FF#############FF~~~",
  "~~FF#####B########F~~~",
  "~~FFF############FF~~~",
  "~~FFFF#####FFFFFFF~oo~",
  "~~FFFFFFFFFFFFFFF~~oo~",
  "~~~~~~~~~~~~~~~~~~~~~~"
];

const WIDTH = LAYOUT[0].length;
const HEIGHT = LAYOUT.length;

// Gameplay anchors. The lane runs door-to-door along the serpentine.
const PLAYER_BASE_ANCHOR = { x: 9, y: 14 };
const PLAYER_DOOR = { x: 9, y: 16 };
const PLAYER_ROOF = { x: 9, y: 15 };
const LAIR_ANCHOR = { x: 15, y: 2 };
const LAIR_DOOR = { x: 15, y: 4 };
const LANE_WAYPOINTS = [
  { x: 15, y: 14 },
  { x: 15, y: 10 },
  { x: 5, y: 9 },
  { x: 5, y: 5 }
];

// Tile ids inside each 54-tile grass tileset (9 columns), learned from the
// original map: 3x3 blob corners/edges/fill, strips and the single island.
const GRASS = {
  topLeft: 1,
  top: 2,
  topRight: 3,
  left: 10,
  fill: 11,
  right: 12,
  bottomLeft: 19,
  bottom: 20,
  bottomRight: 21,
  stripLeft: 28,
  stripMid: 29,
  stripRight: 30,
  stripTop: 4,
  stripVMid: 13,
  stripBottom: 22,
  island: 31
};

// First gids copied from the original map.tmx tileset table.
const GID = {
  brightGrass: 1, // tiles1 / Tilemap_color3 (bright green)
  warmGrass: 55, // tiles1 / Tilemap_color1 (warm yellow-green)
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

const projectRoot = resolve(import.meta.dirname, "..");
const originalTmxPath = resolve(projectRoot, "public/assets/tinywar/map/map.tmx");
const tmxOutPath = resolve(projectRoot, "public/assets/tinywar/map/wildnis.tmx");
const layoutOutPath = resolve(projectRoot, "src/core/map/generated/wildnisMapLayout.ts");

function cell(x, y) {
  if (x < 0 || y < 0 || x >= WIDTH || y >= HEIGHT) {
    return "~";
  }
  return LAYOUT[y][x];
}

const isLand = (x, y) => cell(x, y) !== "~";
const isWalkable = (x, y) => cell(x, y) === "#" || cell(x, y) === "B";
const isForest = (x, y) => cell(x, y) === "F";

function autotile(inMask, x, y) {
  const n = inMask(x, y - 1);
  const s = inMask(x, y + 1);
  const w = inMask(x - 1, y);
  const e = inMask(x + 1, y);

  if (!w && !e) {
    if (!n && !s) return GRASS.island;
    if (!n) return GRASS.stripTop;
    if (!s) return GRASS.stripBottom;
    return GRASS.stripVMid;
  }

  if (!n && !s) {
    if (!w) return GRASS.stripLeft;
    if (!e) return GRASS.stripRight;
    return GRASS.stripMid;
  }

  if (!n) {
    if (!w) return GRASS.topLeft;
    if (!e) return GRASS.topRight;
    return GRASS.top;
  }

  if (!s) {
    if (!w) return GRASS.bottomLeft;
    if (!e) return GRASS.bottomRight;
    return GRASS.bottom;
  }

  if (!w) return GRASS.left;
  if (!e) return GRASS.right;
  return GRASS.fill;
}

function layerFromMask(inMask, firstGid) {
  const data = new Array(WIDTH * HEIGHT).fill(0);
  for (let y = 0; y < HEIGHT; y += 1) {
    for (let x = 0; x < WIDTH; x += 1) {
      if (inMask(x, y)) {
        data[y * WIDTH + x] = firstGid - 1 + autotile(inMask, x, y);
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
      if (!isLand(x, y)) {
        continue;
      }
      const touchesWater = !isLand(x, y - 1) || !isLand(x, y + 1) || !isLand(x - 1, y) || !isLand(x + 1, y);
      // Foam sprites are 192px and spread around their anchor; every other
      // border tile is enough for a continuous shoreline.
      if (touchesWater && (x + y) % 2 === 0) {
        data[y * WIDTH + x] = GID.foam;
      }
    }
  }
  return data;
}

function buildTreeLayer() {
  const data = new Array(WIDTH * HEIGHT).fill(0);
  const trees = [GID.tree1, GID.tree2, GID.tree3];
  for (let y = 0; y < HEIGHT; y += 1) {
    for (let x = 0; x < WIDTH; x += 1) {
      if (!isForest(x, y)) {
        continue;
      }
      // Tree sprites are 192px wide anchored bottom-left; keep them off the
      // last two columns so canopies never overhang open water.
      if (!isLand(x + 1, y) || !isLand(x + 2, y)) {
        continue;
      }
      const roll = hash(x, y, 1);
      if (roll < 0.42) {
        data[y * WIDTH + x] = trees[Math.floor(hash(x, y, 2) * trees.length)];
      }
    }
  }
  return data;
}

function buildDecorationLayer() {
  const data = new Array(WIDTH * HEIGHT).fill(0);
  const bushes = [GID.bushe1, GID.bushe2, GID.bushe3, GID.bushe4];
  const waterRocks = [GID.waterRocks1, GID.waterRocks2, GID.waterRocks3, GID.waterRocks4];

  for (let y = 0; y < HEIGHT; y += 1) {
    for (let x = 0; x < WIDTH; x += 1) {
      const here = cell(x, y);

      // Bushes soften the forest border along the corridor.
      if (here === "F") {
        const bordersPath =
          isWalkable(x, y - 1) || isWalkable(x, y + 1) || isWalkable(x - 1, y) || isWalkable(x + 1, y);
        if (bordersPath && hash(x, y, 3) < 0.3) {
          data[y * WIDTH + x] = bushes[Math.floor(hash(x, y, 4) * bushes.length)];
          continue;
        }
      }

      // Bushes give the small islets some life.
      if (here === "o" && hash(x, y, 9) < 0.6) {
        data[y * WIDTH + x] = bushes[Math.floor(hash(x, y, 10) * bushes.length)];
        continue;
      }

      // Occasional rocks and stumps in open meadows.
      if (here === "#" && hash(x, y, 5) < 0.045) {
        data[y * WIDTH + x] = hash(x, y, 6) < 0.5 ? GID.rock1 : GID.stump1;
        continue;
      }

      // Animated water rocks scattered offshore.
      if (here === "~" && hash(x, y, 7) < 0.05) {
        const nearLand = isLand(x - 1, y) || isLand(x + 1, y) || isLand(x, y - 1) || isLand(x, y + 1);
        if (!nearLand) {
          data[y * WIDTH + x] = waterRocks[Math.floor(hash(x, y, 8) * waterRocks.length)];
        }
      }
    }
  }

  // A couple of sheep grazing near the player base for charm.
  const sheepSpots = [
    { x: PLAYER_BASE_ANCHOR.x - 3, y: PLAYER_BASE_ANCHOR.y + 1 },
    { x: PLAYER_BASE_ANCHOR.x + 3, y: PLAYER_BASE_ANCHOR.y + 2 }
  ];
  for (const spot of sheepSpots) {
    if (isWalkable(spot.x, spot.y)) {
      data[spot.y * WIDTH + spot.x] = GID.sheep;
    }
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

// Reuse the original tileset table verbatim (same first gids, same image
// paths, same foam/water-rock animations).
const originalXml = readFileSync(originalTmxPath, "utf8");
const tilesetStart = originalXml.indexOf("<tileset");
const tilesetEnd = originalXml.lastIndexOf("</tileset>") + "</tileset>".length;
const tilesetXml = originalXml.slice(tilesetStart, tilesetEnd);

const layers = [
  { id: 1, name: "foam", data: buildFoamLayer() },
  { id: 2, name: "ground", data: layerFromMask(isLand, GID.warmGrass) },
  { id: 3, name: "path", data: layerFromMask(isWalkable, GID.brightGrass) },
  { id: 4, name: "trees", data: buildTreeLayer() },
  { id: 5, name: "deco", data: buildDecorationLayer() }
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
<map version="1.10" tiledversion="1.11.2" orientation="orthogonal" renderorder="right-down" width="${WIDTH}" height="${HEIGHT}" tilewidth="64" tileheight="64" infinite="0" nextlayerid="6" nextobjectid="1">
 ${tilesetXml}
${layerXml}
</map>
`;

writeFileSync(tmxOutPath, tmx, "utf8");

const walkableRows = LAYOUT.map((row) => [...row].map((c) => (c === "#" || c === "B" ? "#" : ".")).join(""));

const layoutTs = `// Generated by scripts/generate-wildnis-map.mjs - do not edit by hand.
import type { TilePosition } from "../mapGeometry";

export const WILDNIS_SIZE = { width: ${WIDTH}, height: ${HEIGHT} } as const;

export const WILDNIS_WALKABLE: readonly string[] = ${JSON.stringify(walkableRows, null, 2)};

export const WILDNIS_PLAYER_BASE_ANCHOR: TilePosition = ${JSON.stringify(PLAYER_BASE_ANCHOR)};
export const WILDNIS_PLAYER_DOOR: TilePosition = ${JSON.stringify(PLAYER_DOOR)};
export const WILDNIS_PLAYER_ROOF: TilePosition = ${JSON.stringify(PLAYER_ROOF)};
export const WILDNIS_LAIR_ANCHOR: TilePosition = ${JSON.stringify(LAIR_ANCHOR)};
export const WILDNIS_LAIR_DOOR: TilePosition = ${JSON.stringify(LAIR_DOOR)};
export const WILDNIS_LANE_WAYPOINTS: readonly TilePosition[] = ${JSON.stringify(LANE_WAYPOINTS)};
`;

mkdirSync(dirname(layoutOutPath), { recursive: true });
writeFileSync(layoutOutPath, layoutTs, "utf8");

console.log(`Wrote ${tmxOutPath}`);
console.log(`Wrote ${layoutOutPath}`);
