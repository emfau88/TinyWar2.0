import Phaser from "phaser";

export class CameraDragController {
  private previous?: Phaser.Math.Vector2;
  private keys?: Record<"up" | "left" | "down" | "right", Phaser.Input.Keyboard.Key>;

  constructor(private readonly scene: Phaser.Scene) {
    this.keys = scene.input.keyboard?.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      right: Phaser.Input.Keyboard.KeyCodes.D
    }) as Record<"up" | "left" | "down" | "right", Phaser.Input.Keyboard.Key> | undefined;

    scene.input.on("pointerdown", this.onPointerDown, this);
    scene.input.on("pointermove", this.onPointerMove, this);
    scene.input.on("pointerup", this.onPointerUp, this);
    scene.input.on("pointerupoutside", this.onPointerUp, this);
    scene.input.on("wheel", this.onWheel, this);
    scene.events.on("update", this.update, this);
  }

  destroy(): void {
    this.scene.input.off("pointerdown", this.onPointerDown, this);
    this.scene.input.off("pointermove", this.onPointerMove, this);
    this.scene.input.off("pointerup", this.onPointerUp, this);
    this.scene.input.off("pointerupoutside", this.onPointerUp, this);
    this.scene.input.off("wheel", this.onWheel, this);
    this.scene.events.off("update", this.update, this);
  }

  private update(_time: number, delta: number): void {
    if (!this.keys) {
      return;
    }

    const camera = this.scene.cameras.main;
    const speed = (420 * delta) / 1000 / camera.zoom;
    const x = Number(this.keys.right.isDown) - Number(this.keys.left.isDown);
    const y = Number(this.keys.down.isDown) - Number(this.keys.up.isDown);

    if (x !== 0 || y !== 0) {
      camera.scrollX += x * speed;
      camera.scrollY += y * speed;
    }
  }

  private onPointerDown(pointer: Phaser.Input.Pointer): void {
    this.previous = new Phaser.Math.Vector2(pointer.x, pointer.y);
  }

  private onPointerMove(pointer: Phaser.Input.Pointer): void {
    if (!pointer.isDown || !this.previous) {
      return;
    }

    const camera = this.scene.cameras.main;
    const dx = (pointer.x - this.previous.x) / camera.zoom;
    const dy = (pointer.y - this.previous.y) / camera.zoom;
    camera.scrollX -= dx;
    camera.scrollY -= dy;
    this.previous.set(pointer.x, pointer.y);
  }

  private onPointerUp(): void {
    this.previous = undefined;
  }

  private onWheel(
    _pointer: Phaser.Input.Pointer,
    _gameObjects: Phaser.GameObjects.GameObject[],
    _deltaX: number,
    deltaY: number
  ): void {
    const camera = this.scene.cameras.main;
    const factor = deltaY > 0 ? 0.9 : 1.1;
    camera.setZoom(Phaser.Math.Clamp(camera.zoom * factor, 0.35, 1.4));
  }
}
