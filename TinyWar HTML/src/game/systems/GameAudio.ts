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

const MUSIC_VOLUME = 0.16;

export class GameAudio {
  private unlocked = false;
  private muted = false;

  constructor(private readonly scene: Phaser.Scene) {
    this.unlockOnFirstGesture();
    GameAudio.ensureMusic(scene);
  }

  /**
   * Start the looping background music once, surviving scene switches (the
   * sound manager is game-global). Waits for the browser's autoplay unlock.
   */
  static ensureMusic(scene: Phaser.Scene): void {
    const key = ASSETS.audio.music.key;
    if (!scene.cache.audio.exists(key)) {
      return;
    }

    const start = () => {
      if (!scene.sound.get(key)?.isPlaying) {
        scene.sound.play(key, { loop: true, volume: MUSIC_VOLUME });
      }
    };

    if (scene.sound.get(key)?.isPlaying) {
      return;
    }
    if (scene.sound.locked) {
      scene.sound.once(Phaser.Sound.Events.UNLOCKED, start);
    } else {
      start();
    }
  }

  play(event: AudioEvent): void {
    if (this.muted) {
      return;
    }

    const key = AUDIO_KEYS[event];
    if (!this.scene.cache.audio.exists(key)) {
      return;
    }

    this.scene.sound.play(key, {
      volume: VOLUME[event]
    });
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    this.scene.sound.mute = muted;
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
