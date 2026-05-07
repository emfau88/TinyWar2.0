import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const projectRoot = resolve(import.meta.dirname, "..");
const tmxPath = resolve(projectRoot, "public/assets/tinywar/map/map.tmx");
const generatedPath = resolve(projectRoot, "src/data/generated/mapData.ts");

const FLIP_FLAGS = {
  horizontal: 0x80000000,
  vertical: 0x40000000,
  diagonal: 0x20000000,
  hexagonal120: 0x10000000
};
const ALL_FLIP_FLAGS =
  FLIP_FLAGS.horizontal | FLIP_FLAGS.vertical | FLIP_FLAGS.diagonal | FLIP_FLAGS.hexagonal120;

function attrs(tag) {
  return Object.fromEntries(
    [...tag.matchAll(/([a-zA-Z]+)="([^"]*)"/g)].map(([, key, value]) => [key, value])
  );
}

function parseTmx(xml) {
  const mapTag = xml.match(/<map\b[^>]*>/)?.[0];
  if (!mapTag) {
    throw new Error("Unable to find <map> tag in TMX.");
  }

  const mapAttrs = attrs(mapTag);
  const tilesets = [...xml.matchAll(/<tileset\b([^>]*)>([\s\S]*?)<\/tileset>/g)].map(
    ([, attrText, body]) => {
      const tilesetAttrs = attrs(`<tileset ${attrText}>`);
      const animations = [...body.matchAll(/<tile\b([^>]*)>([\s\S]*?)<\/tile>/g)]
        .map(([, tileAttrText, tileBody]) => {
          const tileAttrs = attrs(`<tile ${tileAttrText}>`);
          const frames = [...tileBody.matchAll(/<frame\b([^>]*)\/>/g)].map((frameMatch) => {
            const frameAttrs = attrs(`<frame ${frameMatch[1]}>`);
            return {
              tileId: Number(frameAttrs.tileid),
              duration: Number(frameAttrs.duration)
            };
          });
          return frames.length > 0 ? [tileAttrs.id, frames] : undefined;
        })
        .filter(Boolean);

      return {
        firstGid: Number(tilesetAttrs.firstgid),
        name: tilesetAttrs.name,
        tileWidth: Number(tilesetAttrs.tilewidth),
        tileHeight: Number(tilesetAttrs.tileheight),
        tileCount: Number(tilesetAttrs.tilecount),
        columns: Number(tilesetAttrs.columns),
        image: attrs(body.match(/<image\b[^>]*>/)?.[0] ?? "").source,
        imageWidth: Number(attrs(body.match(/<image\b[^>]*>/)?.[0] ?? "").width),
        imageHeight: Number(attrs(body.match(/<image\b[^>]*>/)?.[0] ?? "").height),
        animations: Object.fromEntries(animations)
      };
    }
  );
  const layers = [...xml.matchAll(/<layer\b([^>]*)>\s*<data encoding="csv">([\s\S]*?)<\/data>\s*<\/layer>/g)].map(
    ([, attrText, csv]) => {
      const layerAttrs = attrs(`<layer ${attrText}>`);
      return {
        id: Number(layerAttrs.id),
        name: layerAttrs.name,
        width: Number(layerAttrs.width),
        height: Number(layerAttrs.height),
        data: csv
          .trim()
          .split(",")
          .map((value) => Number(value.trim()))
      };
    }
  );

  return {
    width: Number(mapAttrs.width),
    height: Number(mapAttrs.height),
    tileWidth: Number(mapAttrs.tilewidth),
    tileHeight: Number(mapAttrs.tileheight),
    tilesets,
    layers
  };
}

function parseGeneratedMapData(source) {
  const json = source.match(/export const MAP_DATA = ([\s\S]*?) as const satisfies TiledMapData;/)?.[1];
  if (!json) {
    throw new Error("Unable to extract MAP_DATA JSON from generated mapData.ts.");
  }
  return JSON.parse(json);
}

function gidWithoutFlags(gid) {
  return (gid >>> 0) & ~ALL_FLIP_FLAGS;
}

function flagsForGid(gid) {
  const unsigned = gid >>> 0;
  return Object.entries(FLIP_FLAGS)
    .filter(([, flag]) => (unsigned & flag) !== 0)
    .map(([name]) => name);
}

function findTileset(gid, tilesets) {
  for (let index = tilesets.length - 1; index >= 0; index -= 1) {
    const tileset = tilesets[index];
    if (gid >= tileset.firstGid) {
      return tileset;
    }
  }
  return undefined;
}

function footprintForPlacement(column, row, tileset, map) {
  const widthInCells = Math.ceil(tileset.tileWidth / map.tileWidth);
  const heightInCells = Math.ceil(tileset.tileHeight / map.tileHeight);
  return {
    anchorPixelX: column * map.tileWidth,
    anchorPixelY: (row + 1) * map.tileHeight,
    minColumn: column,
    maxColumn: column + widthInCells - 1,
    minRow: row - heightInCells + 1,
    maxRow: row,
    widthInCells,
    heightInCells,
    clipped:
      column < 0 ||
      row < 0 ||
      column + widthInCells - 1 >= map.width ||
      row - heightInCells + 1 < 0 ||
      row >= map.height
  };
}

function countBy(items, keyFn) {
  const counts = new Map();
  for (const item of items) {
    const key = keyFn(item);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts.entries()].sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]));
}

function summarizeMap(sourceMap, generatedMap) {
  const findings = [];

  if (sourceMap.width !== generatedMap.width || sourceMap.height !== generatedMap.height) {
    findings.push(`Map size mismatch: TMX ${sourceMap.width}x${sourceMap.height}, generated ${generatedMap.width}x${generatedMap.height}`);
  }

  if (sourceMap.layers.map((layer) => layer.name).join("|") !== generatedMap.layers.map((layer) => layer.name).join("|")) {
    findings.push("Layer order/name mismatch between TMX and generated mapData.");
  }

  const flagged = [];
  const oversized = [];
  const animatedTilesets = [];
  for (const tileset of sourceMap.tilesets) {
    if (Object.keys(tileset.animations).length > 0) {
      animatedTilesets.push(
        `${tileset.name}@${tileset.firstGid} animations=${Object.keys(tileset.animations).join(",")}`
      );
    }
  }

  for (const layer of sourceMap.layers) {
    layer.data.forEach((gid, index) => {
      if (gid === 0) {
        return;
      }

      const cleanGid = gidWithoutFlags(gid);
      const flags = flagsForGid(gid);
      const tileset = findTileset(cleanGid, sourceMap.tilesets);
      const column = index % layer.width;
      const row = Math.floor(index / layer.width);

      if (flags.length > 0) {
        flagged.push({
          layer: layer.name,
          column,
          row,
          rawGid: gid,
          cleanGid,
          flags,
          tileset: tileset?.name,
          localId: tileset ? cleanGid - tileset.firstGid : undefined
        });
      }

      if (tileset && (tileset.tileWidth !== sourceMap.tileWidth || tileset.tileHeight !== sourceMap.tileHeight)) {
        const footprint = footprintForPlacement(column, row, tileset, sourceMap);
        oversized.push({
          layer: layer.name,
          column,
          row,
          gid: cleanGid,
          tileset: tileset.name,
          image: tileset.image,
          tileWidth: tileset.tileWidth,
          tileHeight: tileset.tileHeight,
          localId: cleanGid - tileset.firstGid,
          footprint
        });
      }
    });
  }

  return {
    findings,
    flagged,
    oversized,
    animatedTilesets,
    oversizedByLayer: countBy(oversized, (item) => item.layer),
    oversizedByTileset: countBy(oversized, (item) => `${item.tileset} ${item.tileWidth}x${item.tileHeight}`),
    clippedOversized: oversized.filter((item) => item.footprint.clipped),
    nonFoamOversized: oversized.filter((item) => item.tileset.toLowerCase() !== "foam")
  };
}

function formatOversizedPlacement(item) {
  const footprint = item.footprint;
  return `${item.layer} (${item.column},${item.row}) ${item.tileset} ${item.tileWidth}x${item.tileHeight} localId=${item.localId} covers cols ${footprint.minColumn}-${footprint.maxColumn}, rows ${footprint.minRow}-${footprint.maxRow}${footprint.clipped ? " CLIPPED" : ""}`;
}

const sourceMap = parseTmx(readFileSync(tmxPath, "utf8"));
const generatedMap = parseGeneratedMapData(readFileSync(generatedPath, "utf8"));
const report = summarizeMap(sourceMap, generatedMap);

console.log("Map diagnosis");
console.log(`- Size: ${sourceMap.width}x${sourceMap.height}, tile ${sourceMap.tileWidth}x${sourceMap.tileHeight}`);
console.log(`- Layers: ${sourceMap.layers.map((layer) => layer.name).join(" -> ")}`);
console.log(`- Tilesets: ${sourceMap.tilesets.length}`);
console.log(`- Animated tilesets: ${report.animatedTilesets.length}`);
for (const item of report.animatedTilesets) {
  console.log(`  - ${item}`);
}

console.log(`- GIDs with Tiled flip/rotation flags: ${report.flagged.length}`);
for (const item of report.flagged) {
  console.log(
    `  - ${item.layer} (${item.column},${item.row}) raw=${item.rawGid} clean=${item.cleanGid} flags=${item.flags.join("+")} tileset=${item.tileset} localId=${item.localId}`
  );
}

console.log(`- Non-64x64 tile placements: ${report.oversized.length}`);
console.log("  Renderer model: bottom-left anchor at cell bottom-left, matching Tiled's large-tile draw model.");
console.log("  Footprint columns/rows below describe the cells visually covered by the large sprite.");
console.log(`  Clipped by map bounds: ${report.clippedOversized.length}`);
console.log("  By layer:");
for (const [layer, count] of report.oversizedByLayer) {
  console.log(`    - ${layer}: ${count}`);
}
console.log("  By tileset:");
for (const [tileset, count] of report.oversizedByTileset) {
  console.log(`    - ${tileset}: ${count}`);
}
for (const item of report.oversized.slice(0, 30)) {
  console.log(`  - ${formatOversizedPlacement(item)}`);
}
if (report.oversized.length > 30) {
  console.log(`  - ... ${report.oversized.length - 30} more`);
}
console.log(`  Non-foam placements: ${report.nonFoamOversized.length}`);
for (const item of report.nonFoamOversized) {
  console.log(`    - ${formatOversizedPlacement(item)}`);
}
console.log(`  Clipped placements: ${report.clippedOversized.length}`);
for (const item of report.clippedOversized) {
  console.log(`    - ${formatOversizedPlacement(item)}`);
}

if (report.findings.length > 0) {
  console.log("- Structural findings:");
  for (const finding of report.findings) {
    console.log(`  - ${finding}`);
  }
}
