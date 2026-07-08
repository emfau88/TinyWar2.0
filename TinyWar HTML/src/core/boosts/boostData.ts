// The core-package boost catalogue for TinyWar HTML. Only the "core pack"
// boosts are modelled here - the ones we can fully implement with the units
// and systems that already exist (Warrior/Lancer/Archer/Priest plus the
// Snake/Bear/Troll monsters). Values mirror the original tinywar boosts.rs.

export type BoostName =
  // Timed stat / tempo buffs
  | "Warrior"
  | "Lancer"
  | "Arrows"
  | "ArmorGain"
  | "Run"
  | "Penetration"
  | "Longbow"
  // Instant effects
  | "InstantHealing"
  | "Repair"
  | "InstantArmy"
  | "Clone"
  | "Lightning"
  | "Snakes"
  | "SpawnTrolls"
  | "BearDefender";

export type BoostKind = "timed" | "instant";

export interface BoostDefinition {
  name: BoostName;
  /** German display title shown on the draft card. */
  title: string;
  /** German one-line description. */
  description: string;
  kind: BoostKind;
  /** Active duration in ms for timed boosts; 0 for instant boosts. */
  durationMs: number;
}

export const CORE_BOOSTS: Record<BoostName, BoostDefinition> = {
  Warrior: {
    name: "Warrior",
    title: "Krieger-Wut",
    description: "Deine Warriors verursachen 50 % mehr Schaden.",
    kind: "timed",
    durationMs: 40000
  },
  Lancer: {
    name: "Lancer",
    title: "Lanzen-Schärfe",
    description: "Deine Lancers verursachen 60 % mehr Schaden.",
    kind: "timed",
    durationMs: 40000
  },
  Arrows: {
    name: "Arrows",
    title: "Pfeilhagel",
    description: "Deine Archer verursachen 30 % mehr Schaden.",
    kind: "timed",
    durationMs: 40000
  },
  ArmorGain: {
    name: "ArmorGain",
    title: "Rüstung",
    description: "Deine Einheiten erleiden 30 % weniger Schaden.",
    kind: "timed",
    durationMs: 20000
  },
  Run: {
    name: "Run",
    title: "Ansturm",
    description: "Deine Einheiten bewegen sich doppelt so schnell.",
    kind: "timed",
    durationMs: 15000
  },
  Penetration: {
    name: "Penetration",
    title: "Durchschlag",
    description: "Deine Einheiten erhalten +5 Rüstungsdurchschlag.",
    kind: "timed",
    durationMs: 30000
  },
  Longbow: {
    name: "Longbow",
    title: "Langbogen",
    description: "Die Reichweite deiner Archer steigt um 50 %.",
    kind: "timed",
    durationMs: 40000
  },
  InstantHealing: {
    name: "InstantHealing",
    title: "Heilwelle",
    description: "Heilt alle deine Einheiten sofort vollständig.",
    kind: "instant",
    durationMs: 0
  },
  Repair: {
    name: "Repair",
    title: "Reparatur",
    description: "Repariert alle deine Gebäude sofort vollständig.",
    kind: "instant",
    durationMs: 0
  },
  InstantArmy: {
    name: "InstantArmy",
    title: "Sofort-Armee",
    description: "Spawnt sofort 6 zufällige Einheiten an deiner Basis.",
    kind: "instant",
    durationMs: 0
  },
  Clone: {
    name: "Clone",
    title: "Klon",
    description: "Verdoppelt bis zu 8 deiner marschierenden Einheiten.",
    kind: "instant",
    durationMs: 0
  },
  Lightning: {
    name: "Lightning",
    title: "Blitzschlag",
    description: "Halbiert die Lebenspunkte aller Einheiten auf der Karte.",
    kind: "instant",
    durationMs: 0
  },
  Snakes: {
    name: "Snakes",
    title: "Schlangenschwarm",
    description: "Beschwört einen Schwarm Schlangen für dich.",
    kind: "instant",
    durationMs: 0
  },
  SpawnTrolls: {
    name: "SpawnTrolls",
    title: "Troll-Ruf",
    description: "Beschwört Trolle, die für dich vorrücken.",
    kind: "instant",
    durationMs: 0
  },
  BearDefender: {
    name: "BearDefender",
    title: "Bären-Wächter",
    description: "Jeder deiner Priester beschwört einen Bären.",
    kind: "instant",
    durationMs: 0
  }
};

export const CORE_BOOST_NAMES: readonly BoostName[] = Object.keys(CORE_BOOSTS) as BoostName[];

export function boostDefinition(name: BoostName): BoostDefinition {
  return CORE_BOOSTS[name];
}

export function isTimedBoost(name: BoostName): boolean {
  return CORE_BOOSTS[name].kind === "timed";
}
