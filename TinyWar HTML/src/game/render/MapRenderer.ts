import Phaser from "phaser";
import { getActiveMap } from "../../core/map/activeMap";
import { mapDataFor } from "../../data/mapRegistry";
import type { TiledAnimationFrame, TiledLayerData, TiledTilesetData } from "../../data/mapTypes";
import { visualOffsetForTileset } from "./mapTileVisualOffset";

const WATER_COLOR = 0x47aba9;

interface AnimatedTileHandle {
  tile: Phaser.GameObjects.Image;
  frames: readonly TiledAnimationFrame[];
  frameIndex: number;
  elapsedMs: number;
}

export class MapRenderer {
  private readonly container: Phaser.GameObjects.Container;
  private readonly mapData = mapDataFor(getActiveMap().id);
  private animatedTiles: AnimatedTileHandle[] = [];

  constructor(private readonly scene: Phaser.Scene) {
    this.container = scene.add.container(0, 0);
  }

  render(): void {
    this.container.removeAll(true);
    this.animatedTiles = [];

    const mapWidth = this.mapData.width * this.mapData.tileWidth;
    const mapHeight = this.mapData.height * this.mapData.tileHeight;
    const water = this.scene.add.rectangle(0, 0, mapWidth, mapHeight, WATER_COLOR).setOrigin(0);
    this.container.add(water);

    for (const layer of this.mapData.layers) {
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

        const baseLocalId = gid - tileset.firstGid;
        const frames = this.animationFrames(baseLocalId, tileset);
        const localId = frames?.[0]?.tileId ?? baseLocalId;
        const column = index % layer.width;
        const row = Math.floor(index / layer.width);
        const x = column * this.mapData.tileWidth;
        const y = (row + 1) * this.mapData.tileHeight;
        const offset = visualOffsetForTileset(tileset);
        const tile = this.scene.add.image(x + offset.x, y + offset.y, tileset.key, localId);

        tile.setOrigin(0, 1);
        const flags = (layer as TiledLayerData).tileFlags[index];
        if (flags) {
          tile.setFlip(flags.horizontal, flags.vertical);
          if (flags.diagonal || flags.hexagonal120) {
            console.warn(`Unsupported Tiled rotation flag at ${layer.name}[${index}].`);
          }
        }
        layerContainer.add(tile);

        if (frames) {
          this.animatedTiles.push({ tile, frames, frameIndex: 0, elapsedMs: 0 });
        }
      });

      this.container.add(layerContainer);
    }
  }

  update(deltaMs: number): void {
    for (const animatedTile of this.animatedTiles) {
      animatedTile.elapsedMs += deltaMs;

      let currentFrame = animatedTile.frames[animatedTile.frameIndex];
      while (animatedTile.elapsedMs >= currentFrame.duration) {
        animatedTile.elapsedMs -= currentFrame.duration;
        animatedTile.frameIndex = (animatedTile.frameIndex + 1) % animatedTile.frames.length;
        currentFrame = animatedTile.frames[animatedTile.frameIndex];
        animatedTile.tile.setFrame(currentFrame.tileId);
      }
    }
  }

  getWorldSize(): Phaser.Math.Vector2 {
    return new Phaser.Math.Vector2(
      this.mapData.width * this.mapData.tileWidth,
      this.mapData.height * this.mapData.tileHeight
    );
  }

  private findTileset(gid: number): TiledTilesetData | undefined {
    for (let index = this.mapData.tilesets.length - 1; index >= 0; index -= 1) {
      const tileset = this.mapData.tilesets[index];
      if (gid >= tileset.firstGid) {
        return tileset;
      }
    }

    return undefined;
  }

  private animationFrames(
    localId: number,
    tileset: TiledTilesetData
  ): readonly TiledAnimationFrame[] | undefined {
    const frames = tileset.animations[String(localId)];
    return frames && frames.length > 0 ? frames : undefined;
  }
}
