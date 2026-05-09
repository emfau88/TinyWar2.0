import Phaser from "phaser";

type CameraInputState = "idle" | "single-pan" | "pinch-zoom";

export const DESKTOP_MIN_ZOOM = 0.35;
export const DESKTOP_MAX_ZOOM = 1.4;
export const MOBILE_MIN_ZOOM = 0.4;
export const MOBILE_MAX_ZOOM = 1.2;

export function clampCameraScrollToBounds(camera: Phaser.Cameras.Scene2D.Camera): void {
  const bounds = (camera as Phaser.Cameras.Scene2D.Camera & {
    _bounds?: Phaser.Geom.Rectangle;
  })._bounds;
  if (!camera.useBounds || !bounds) {
    return;
  }

  const visibleWidth = camera.width / camera.zoom;
  const visibleHeight = camera.height / camera.zoom;
  const minScrollX = bounds.x;
  const minScrollY = bounds.y;
  const maxScrollX = Math.max(minScrollX, bounds.right - visibleWidth);
  const maxScrollY = Math.max(minScrollY, bounds.bottom - visibleHeight);

  camera.scrollX = Phaser.Math.Clamp(camera.scrollX, minScrollX, maxScrollX);
  camera.scrollY = Phaser.Math.Clamp(camera.scrollY, minScrollY, maxScrollY);
}

export class CameraDragController {
  private state: CameraInputState = "idle";
  private enabled = true;
  private previous?: Phaser.Math.Vector2;
  private pinchStartDistance?: number;
  private pinchStartZoom?: number;
  private pinchAnchorWorld?: Phaser.Math.Vector2;
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

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) {
      this.resetInputState();
    }
  }

  private update(_time: number, delta: number): void {
    if (!this.enabled || !this.keys) {
      return;
    }

    const camera = this.scene.cameras.main;
    const speed = (420 * delta) / 1000 / camera.zoom;
    const x = Number(this.keys.right.isDown) - Number(this.keys.left.isDown);
    const y = Number(this.keys.down.isDown) - Number(this.keys.up.isDown);

    if (x !== 0 || y !== 0) {
      camera.scrollX += x * speed;
      camera.scrollY += y * speed;
      clampCameraScrollToBounds(camera);
    }
  }

  private onPointerDown(pointer: Phaser.Input.Pointer): void {
    if (!this.enabled) {
      return;
    }

    const activePointers = this.getActivePointers();
    if (activePointers.length >= 2) {
      this.beginPinch(activePointers[0], activePointers[1]);
      return;
    }

    this.state = "single-pan";
    this.previous = new Phaser.Math.Vector2(pointer.x, pointer.y);
  }

  private onPointerMove(pointer: Phaser.Input.Pointer): void {
    if (!this.enabled || !pointer.isDown) {
      return;
    }

    const activePointers = this.getActivePointers();
    if (activePointers.length >= 2) {
      if (this.state !== "pinch-zoom") {
        this.beginPinch(activePointers[0], activePointers[1]);
      } else {
        this.updatePinch(activePointers[0], activePointers[1]);
      }
      return;
    }

    if (this.state !== "single-pan" || !this.previous) {
      return;
    }

    const camera = this.scene.cameras.main;
    const dx = (pointer.x - this.previous.x) / camera.zoom;
    const dy = (pointer.y - this.previous.y) / camera.zoom;
    camera.scrollX -= dx;
    camera.scrollY -= dy;
    clampCameraScrollToBounds(camera);
    this.previous.set(pointer.x, pointer.y);
  }

  private onPointerUp(): void {
    if (!this.enabled) {
      this.resetInputState();
      return;
    }

    const activePointers = this.getActivePointers();
    if (activePointers.length >= 2) {
      this.beginPinch(activePointers[0], activePointers[1]);
      return;
    }

    if (activePointers.length === 1) {
      const [remainingPointer] = activePointers;
      this.state = "single-pan";
      this.pinchStartDistance = undefined;
      this.pinchStartZoom = undefined;
      this.pinchAnchorWorld = undefined;
      this.previous = new Phaser.Math.Vector2(remainingPointer.x, remainingPointer.y);
      return;
    }

    this.state = "idle";
    this.previous = undefined;
    this.pinchStartDistance = undefined;
    this.pinchStartZoom = undefined;
    this.pinchAnchorWorld = undefined;
  }

  private onWheel(
    _pointer: Phaser.Input.Pointer,
    _gameObjects: Phaser.GameObjects.GameObject[],
    _deltaX: number,
    deltaY: number
  ): void {
    if (!this.enabled) {
      return;
    }

    const camera = this.scene.cameras.main;
    const factor = deltaY > 0 ? 0.9 : 1.1;
    camera.setZoom(
      Phaser.Math.Clamp(
        camera.zoom * factor,
        DESKTOP_MIN_ZOOM,
        DESKTOP_MAX_ZOOM
      )
    );
    clampCameraScrollToBounds(camera);
  }

  private beginPinch(pointerA: Phaser.Input.Pointer, pointerB: Phaser.Input.Pointer): void {
    const camera = this.scene.cameras.main;
    const midpoint = pinchMidpoint(pointerA, pointerB);
    this.state = "pinch-zoom";
    this.previous = undefined;
    this.pinchStartDistance = Phaser.Math.Distance.Between(pointerA.x, pointerA.y, pointerB.x, pointerB.y);
    this.pinchStartZoom = camera.zoom;
    this.pinchAnchorWorld = camera.getWorldPoint(midpoint.x, midpoint.y);
  }

  private updatePinch(pointerA: Phaser.Input.Pointer, pointerB: Phaser.Input.Pointer): void {
    if (!this.pinchStartDistance || !this.pinchStartZoom || !this.pinchAnchorWorld) {
      this.beginPinch(pointerA, pointerB);
      return;
    }

    const camera = this.scene.cameras.main;
    const midpoint = pinchMidpoint(pointerA, pointerB);
    const currentDistance = Phaser.Math.Distance.Between(pointerA.x, pointerA.y, pointerB.x, pointerB.y);
    if (currentDistance <= 0) {
      return;
    }

    const targetZoom = this.clampZoom(this.pinchStartZoom * (currentDistance / this.pinchStartDistance));
    camera.setZoom(targetZoom);
    const currentWorldAtMidpoint = camera.getWorldPoint(midpoint.x, midpoint.y);
    camera.scrollX += this.pinchAnchorWorld.x - currentWorldAtMidpoint.x;
    camera.scrollY += this.pinchAnchorWorld.y - currentWorldAtMidpoint.y;
    clampCameraScrollToBounds(camera);
  }

  private clampZoom(zoom: number): number {
    return Phaser.Math.Clamp(zoom, MOBILE_MIN_ZOOM, MOBILE_MAX_ZOOM);
  }

  private getActivePointers(): Phaser.Input.Pointer[] {
    return this.scene.input.manager.pointers.filter((pointer) => pointer.isDown);
  }

  private resetInputState(): void {
    this.state = "idle";
    this.previous = undefined;
    this.pinchStartDistance = undefined;
    this.pinchStartZoom = undefined;
    this.pinchAnchorWorld = undefined;
  }
}

function pinchMidpoint(
  pointerA: Phaser.Input.Pointer,
  pointerB: Phaser.Input.Pointer
): Phaser.Math.Vector2 {
  return new Phaser.Math.Vector2((pointerA.x + pointerB.x) / 2, (pointerA.y + pointerB.y) / 2);
}
