import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

const projectRoot = resolve(import.meta.dirname, "..");

const MAPS = [
  {
    tmx: "public/assets/tinywar/map/map.tmx",
    out: "src/data/generated/mapData.ts",
    exportName: "MAP_DATA",
    keyPrefix: "map"
  },
  {
    tmx: "public/assets/tinywar/map/wildnis.tmx",
    out: "src/data/generated/wildnisMapData.ts",
    exportName: "WILDNIS_MAP_DATA",
    keyPrefix: "wildnis"
  }
];

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

function generateMap({ tmx, out, exportName, keyPrefix }) {
const xml = readFileSync(resolve(projectRoot, tmx), "utf8");
const outputPath = resolve(projectRoot, out);

const mapTag = xml.match(/<map\b[^>]*>/)?.[0];
if (!mapTag) {
  throw new Error("Unable to find <map> tag in TMX.");
}

const mapAttrs = attrs(mapTag);
const tilesetMatches = [...xml.matchAll(/<tileset\b([^>]*)>([\s\S]*?)<\/tileset>/g)];
const tilesets = tilesetMatches.map(([, attrText, body], index) => {
  const tilesetAttrs = attrs(`<tileset ${attrText}>`);
  const imageTag = body.match(/<image\b[^>]*>/)?.[0];
  if (!imageTag) {
    throw new Error(`Tileset ${tilesetAttrs.name ?? index} has no image.`);
  }

  const imageAttrs = attrs(imageTag);
  const animations = {};
  for (const tileMatch of body.matchAll(/<tile\b([^>]*)>([\s\S]*?)<\/tile>/g)) {
    const tileAttrs = attrs(`<tile ${tileMatch[1]}>`);
    const frames = [...tileMatch[2].matchAll(/<frame\b([^>]*)\/>/g)].map((frameMatch) => {
      const frameAttrs = attrs(`<frame ${frameMatch[1]}>`);
      return {
        tileId: Number(frameAttrs.tileid),
        duration: Number(frameAttrs.duration)
      };
    });

    if (frames.length > 0) {
      animations[tileAttrs.id] = frames;
    }
  }

  return {
    key: `${keyPrefix}-tileset-${index}-${tilesetAttrs.firstgid}`,
    firstGid: Number(tilesetAttrs.firstgid),
    name: tilesetAttrs.name,
    tileWidth: Number(tilesetAttrs.tilewidth),
    tileHeight: Number(tilesetAttrs.tileheight),
    tileCount: Number(tilesetAttrs.tilecount),
    columns: Number(tilesetAttrs.columns),
    image: `/assets/tinywar/map/${imageAttrs.source}`,
    imageWidth: Number(imageAttrs.width),
    imageHeight: Number(imageAttrs.height),
    animations
  };
});

const layers = [...xml.matchAll(/<layer\b([^>]*)>\s*<data encoding="csv">([\s\S]*?)<\/data>\s*<\/layer>/g)].map(
  ([, attrText, csv]) => {
    const layerAttrs = attrs(`<layer ${attrText}>`);
    const tileFlags = {};
    const data = csv
      .trim()
      .split(",")
      .map((value, index) => {
        const rawGid = Number(value.trim());
        const unsignedGid = rawGid >>> 0;
        const cleanGid = unsignedGid & ~ALL_FLIP_FLAGS;
        const flags = Object.fromEntries(
          Object.entries(FLIP_FLAGS).map(([name, flag]) => [name, (unsignedGid & flag) !== 0])
        );

        if (Object.values(flags).some(Boolean)) {
          tileFlags[index] = flags;
        }

        return cleanGid;
      });

    return {
      id: Number(layerAttrs.id),
      name: layerAttrs.name,
      width: Number(layerAttrs.width),
      height: Number(layerAttrs.height),
      data,
      tileFlags
    };
  }
);

const data = {
  width: Number(mapAttrs.width),
  height: Number(mapAttrs.height),
  tileWidth: Number(mapAttrs.tilewidth),
  tileHeight: Number(mapAttrs.tileheight),
  tilesets,
  layers
};

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(
  outputPath,
  `import type { TiledMapData } from "../mapTypes";\n\nexport const ${exportName} = ${JSON.stringify(data, null, 2)} as const satisfies TiledMapData;\n`,
  "utf8"
);
console.log(`Wrote ${outputPath}`);
}

for (const map of MAPS) {
  generateMap(map);
}
