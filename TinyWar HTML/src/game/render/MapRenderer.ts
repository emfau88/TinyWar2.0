import Phaser from "phaser";
import { MAP_DATA } from "../../data/generated/mapData";
import type { TiledLayerData, TiledTilesetData } from "../../data/mapTypes";

const WATER_COLOR = 0x47aba9;

export class MapRenderer {
  private readonly container: Phaser.GameObjects.Container;

  constructor(private readonly scene: Phaser.Scene) {
    this.container = scene.add.container(0, 0);
  }

  render(): void {
    this.container.removeAll(true);

    const mapWidth = MAP_DATA.width * MAP_DATA.tileWidth;
    const mapHeight = MAP_DATA.height * MAP_DATA.tileHeight;
    const water = this.scene.add.rectangle(0, 0, mapWidth, mapHeight, WATER_COLOR).setOrigin(0);
    this.container.add(water);

    for (const layer of MAP_DATA.layers) {
      const layerContainer = this.scene.add.container(0, 0);
      layerContainer.setName(layer.name);

      layer.data.forEach((gid, index) => {
        if (gid === 0) {
          return;
        }

        const tileset = this.findTileset(gid);
        if (!tileset) {
          return;
        }

        const localId = this.firstAnimatedFrame(gid - tileset.firstGid, tileset);
        const column = index % layer.width;
        const row = Math.floor(index / layer.width);
        const x = column * MAP_DATA.tileWidth;
        const y = (row + 1) * MAP_DATA.tileHeight;
        const tile = this.scene.add.image(x, y, tileset.key, localId);

        tile.setOrigin(0, 1);
        const flags = (layer as TiledLayerData).tileFlags[index];
        if (flags) {
          tile.setFlip(flags.horizontal, flags.vertical);
          if (flags.diagonal || flags.hexagonal120) {
            console.warn(`Unsupported Tiled rotation flag at ${layer.name}[${index}].`);
          }
        }
        layerContainer.add(tile);
      });

      this.container.add(layerContainer);
    }
  }

  getWorldSize(): Phaser.Math.Vector2 {
    return new Phaser.Math.Vector2(
      MAP_DATA.width * MAP_DATA.tileWidth,
      MAP_DATA.height * MAP_DATA.tileHeight
    );
  }

  private findTileset(gid: number): TiledTilesetData | undefined {
    for (let index = MAP_DATA.tilesets.length - 1; index >= 0; index -= 1) {
      const tileset = MAP_DATA.tilesets[index];
      if (gid >= tileset.firstGid) {
        return tileset;
      }
    }

    return undefined;
  }

  private firstAnimatedFrame(localId: number, tileset: TiledTilesetData): number {
    const frames = tileset.animations[String(localId)];
    return frames?.[0]?.tileId ?? localId;
  }
}
