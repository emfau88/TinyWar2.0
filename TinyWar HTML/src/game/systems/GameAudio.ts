import Phaser from "phaser";
import { ASSETS } from "../../data/assetManifest";

type AudioEvent = keyof typeof AUDIO_KEYS;

const AUDIO_KEYS = {
  button: ASSETS.audio.button.key,
  click: ASSETS.audio.click.key,
  error: ASSETS.audio.error.key,
  explosion: ASSETS.audio.explosion.key,
  victory: ASSETS.audio.victory.key,
  defeat: ASSETS.audio.defeat.key,
  horn: ASSETS.audio.horn.key,
  message: ASSETS.audio.message.key,
  warning: ASSETS.audio.warning.key
} as const;

const VOLUME: Record<AudioEvent, number> = {
  button: 0.42,
  click: 0.38,
  error: 0.42,
  explosion: 0.48,
  victory: 0.48,
  defeat: 0.48,
  horn: 0.44,
  message: 0.42,
  warning: 0.42
};

export class GameAudio {
  private unlocked = false;

  constructor(private readonly scene: Phaser.Scene) {
    this.unlockOnFirstGesture();
  }

  play(event: AudioEvent): void {
    const key = AUDIO_KEYS[event];
    if (!this.scene.cache.audio.exists(key)) {
      return;
    }

    this.scene.sound.play(key, {
      volume: VOLUME[event]
    });
  }

  private unlockOnFirstGesture(): void {
    const unlock = () => {
      if (this.unlocked) {
        return;
      }

      this.unlocked = true;
      const sound = this.scene.sound as Phaser.Sound.BaseSoundManager & { unlock?: () => void };
      sound.unlock?.();
    };

    this.scene.input.once("pointerdown", unlock);
    this.scene.input.keyboard?.once("keydown", unlock);
  }
}
