import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { BASIC_UNIT_ANIMATIONS, unitAnimationKey } from "./animationManifest";
import { MONSTER_UNITS, UNITS } from "../core/units/unitData";

const GUARD_MONSTERS = ["Minotaur", "Skull", "Turtle"] as const;

function pngSize(path: string): { width: number; height: number } {
  // PNG IHDR: width and height are big-endian u32 at byte offsets 16 and 20.
  const buffer = readFileSync(join(__dirname, "../../public", path));
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

describe("BASIC_UNIT_ANIMATIONS", () => {
  it("covers idle, run and attack for every monster", () => {
    const keys = new Set(BASIC_UNIT_ANIMATIONS.map((animation) => animation.key));
    for (const monster of MONSTER_UNITS) {
      for (const action of ["Idle", "Run", "Attack"] as const) {
        expect(keys, `${monster} ${action}`).toContain(unitAnimationKey("Red", monster, action));
      }
    }
  });

  it("covers guard for the guard-capable monsters", () => {
    const keys = new Set(BASIC_UNIT_ANIMATIONS.map((animation) => animation.key));
    for (const monster of GUARD_MONSTERS) {
      expect(keys).toContain(unitAnimationKey("Red", monster, "Guard"));
    }
  });

  it("uses each unit's sprite size as the frame size", () => {
    for (const animation of BASIC_UNIT_ANIMATIONS) {
      expect(animation.frameWidth, animation.key).toBe(animation.frameHeight);
      const unit = (Object.keys(UNITS) as (keyof typeof UNITS)[]).find((name) =>
        animation.key.includes(`-${name.toLowerCase()}-`)
      );
      expect(unit, animation.key).toBeDefined();
      expect(animation.frameWidth, animation.key).toBe(UNITS[unit as keyof typeof UNITS].spriteSize);
    }
  });

  it("fits every animation into its actual sprite sheet", () => {
    for (const animation of BASIC_UNIT_ANIMATIONS) {
      const sheet = pngSize(animation.path);
      expect(sheet.height, animation.path).toBe(animation.frameHeight);
      // The original intentionally cuts trailing frames on some attack sheets
      // (Gnoll/Shaman/Shark), so the sheet may be wider than frames * width.
      expect(animation.frames * animation.frameWidth, animation.path).toBeLessThanOrEqual(
        sheet.width
      );
    }
  });
});
