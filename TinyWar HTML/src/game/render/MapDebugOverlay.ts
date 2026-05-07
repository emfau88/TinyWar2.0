import Phaser from "phaser";
import { MAP_DATA } from "../../data/generated/mapData";
import type { TiledTilesetData } from "../../data/mapTypes";

const GRID_COLOR = 0xffffff;
const FOAM_COLOR = 0x38bdf8;
const NON_FOAM_COLOR = 0xfacc15;
const CLIPPED_COLOR = 0xef4444;
const GRID_ALPHA = 0.22;
const FOOTPRINT_ALPHA = 0.8;

export class MapDebugOverlay {
  private readonly container: Phaser.GameObjects.Container;

  constructor(private readonly scene: Phaser.Scene) {
    this.container = scene.add.container(0, 0).setDepth(10_000).setVisible(false);
    this.render();
  }

  toggle(): void {
    this.container.setVisible(!this.container.visible);
  }

  destroy(): void {
    this.container.destroy(true);
  }

  private render(): void {
    const graphics = this.scene.add.graphics();
    this.drawGrid(graphics);
    this.drawLargeTileFootprints(graphics);
    this.container.add(graphics);
  }

  private drawGrid(graphics: Phaser.GameObjects.Graphics): void {
    const width = MAP_DATA.width * MAP_DATA.tileWidth;
    const height = MAP_DATA.height * MAP_DATA.tileHeight;

    graphics.lineStyle(1, GRID_COLOR, GRID_ALPHA);
    for (let column = 0; column <= MAP_DATA.width; column += 1) {
      const x = column * MAP_DATA.tileWidth;
      graphics.lineBetween(x, 0, x, height);
    }
    for (let row = 0; row <= MAP_DATA.height; row += 1) {
      const y = row * MAP_DATA.tileHeight;
      graphics.lineBetween(0, y, width, y);
    }

    for (let row = 0; row < MAP_DATA.height; row += 1) {
      for (let column = 0; column < MAP_DATA.width; column += 1) {
        const label = this.scene.add
          .text(column * MAP_DATA.tileWidth + 3, row * MAP_DATA.tileHeight + 2, `${column},${row}`, {
            color: "#ffffff",
            fontFamily: "monospace",
            fontSize: "10px"
          })
          .setAlpha(0.55)
          .setDepth(10_001);
        this.container.add(label);
      }
    }
  }

  private drawLargeTileFootprints(graphics: Phaser.GameObjects.Graphics): void {
    for (const layer of MAP_DATA.layers) {
      layer.data.forEach((gid, index) => {
        if (gid === 0) {
          return;
        }

        const tileset = this.findTileset(gid);
        if (!tileset || this.isMapSizedTile(tileset)) {
          return;
        }

        const column = index % layer.width;
        const row = Math.floor(index / layer.width);
        const footprint = this.footprint(column, row, tileset);
        const color = footprint.clipped
          ? CLIPPED_COLOR
          : tileset.name.toLowerCase() === "foam"
            ? FOAM_COLOR
            : NON_FOAM_COLOR;

        graphics.lineStyle(2, color, FOOTPRINT_ALPHA);
        graphics.strokeRect(footprint.x, footprint.y, footprint.width, footprint.height);
        graphics.fillStyle(color, 0.16);
        graphics.fillRect(footprint.x, footprint.y, footprint.width, footprint.height);
      });
    }
  }

  private footprint(column: number, row: number, tileset: TiledTilesetData) {
    const widthInCells = Math.ceil(tileset.tileWidth / MAP_DATA.tileWidth);
    const heightInCells = Math.ceil(tileset.tileHeight / MAP_DATA.tileHeight);
    const x = column * MAP_DATA.tileWidth;
    const y = (row - heightInCells + 1) * MAP_DATA.tileHeight;
    const width = widthInCells * MAP_DATA.tileWidth;
    const height = heightInCells * MAP_DATA.tileHeight;

    return {
      x,
      y,
      width,
      height,
      clipped:
        column + widthInCells - 1 >= MAP_DATA.width ||
        row - heightInCells + 1 < 0 ||
        row >= MAP_DATA.height
    };
  }

  private isMapSizedTile(tileset: TiledTilesetData): boolean {
    return tileset.tileWidth === MAP_DATA.tileWidth && tileset.tileHeight === MAP_DATA.tileHeight;
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
}
