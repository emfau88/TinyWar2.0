import type { PlayerColor } from "../buildings/buildingData";
import type { UnitName } from "../units/unitData";
import type { ActiveBoost } from "./boostState";

// Concrete gameplay modifiers derived from a color's active timed boosts.
// The combat and movement systems consult these instead of knowing about
// boosts directly, keeping boost rules in one place.

export type ActiveBoostsByColor = Partial<Record<PlayerColor, readonly ActiveBoost[]>>;

function names(active: readonly ActiveBoost[] | undefined): Set<string> {
  return new Set((active ?? []).map((boost) => boost.name));
}

/** Outgoing physical/magic damage multiplier for an attacker of this unit type. */
export function damageMultiplier(
  active: readonly ActiveBoost[] | undefined,
  attacker: UnitName
): number {
  const on = names(active);
  let mult = 1;
  if (attacker === "Warrior" && on.has("Warrior")) mult *= 1.5;
  if (attacker === "Lancer" && on.has("Lancer")) mult *= 1.6;
  if (attacker === "Archer" && on.has("Arrows")) mult *= 1.3;
  return mult;
}

/** Incoming damage multiplier for a defender (ArmorGain reduces damage taken). */
export function damageTakenMultiplier(active: readonly ActiveBoost[] | undefined): number {
  return names(active).has("ArmorGain") ? 0.7 : 1;
}

/** Extra flat armor penetration granted to all of a color's units. */
export function bonusArmorPen(active: readonly ActiveBoost[] | undefined): number {
  return names(active).has("Penetration") ? 5 : 0;
}

/** Movement speed multiplier (Run doubles it). */
export function speedMultiplier(active: readonly ActiveBoost[] | undefined): number {
  return names(active).has("Run") ? 2 : 1;
}

/** Archer attack-range multiplier (Longbow adds 50%). */
export function rangeMultiplier(
  active: readonly ActiveBoost[] | undefined,
  unit: UnitName
): number {
  return unit === "Archer" && names(active).has("Longbow") ? 1.5 : 1;
}
