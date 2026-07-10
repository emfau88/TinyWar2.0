// The boost catalogue for TinyWar HTML. Values mirror the original tinywar
// boosts.rs; with the full bestiary in place this now includes the monster
// boosts (queue unlocks, instant swarms and conversions).

import type { UnitName } from "../units/unitData";

export type BoostName =
  // Timed stat / tempo buffs
  | "Warrior"
  | "Lancer"
  | "Arrows"
  | "ArmorGain"
  | "Run"
  | "Penetration"
  | "Longbow"
  // Timed queue unlocks (one monster becomes recruitable while active)
  | "QueueGoblins"
  | "QueueSharks"
  | "QueueTurtles"
  | "QueueMinotaurs"
  | "QueueShamans"
  // Instant effects
  | "InstantHealing"
  | "Repair"
  | "InstantArmy"
  | "Clone"
  | "Lightning"
  | "Snakes"
  | "SpawnTrolls"
  | "BearDefender"
  | "Skulls"
  | "Spiders"
  | "SpawnTurtles"
  | "ConvertGoblins"
  | "ConvertSharks"
  | "GnomesBasic"
  | "MinotaurRage";

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
  /** For queue boosts: the monster the player may recruit while active. */
  unlocksUnit?: UnitName;
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
  },
  QueueGoblins: {
    name: "QueueGoblins",
    title: "Goblin-Pakt",
    description: "Goblins rekrutierbar - ihr Speer durchbohrt jede Rüstung.",
    kind: "timed",
    durationMs: 40000,
    unlocksUnit: "Goblin"
  },
  QueueSharks: {
    name: "QueueSharks",
    title: "Hai-Pakt",
    description: "Haie rekrutierbar - Fernkampf mit tödlichen Harpunen.",
    kind: "timed",
    durationMs: 40000,
    unlocksUnit: "Shark"
  },
  QueueTurtles: {
    name: "QueueTurtles",
    title: "Schildkröten-Pakt",
    description: "Schildkröten rekrutierbar - fast unzerstörbare Blocker.",
    kind: "timed",
    durationMs: 40000,
    unlocksUnit: "Turtle"
  },
  QueueMinotaurs: {
    name: "QueueMinotaurs",
    title: "Minotaurus-Pakt",
    description: "Minotauren rekrutierbar - stark in Angriff und Abwehr.",
    kind: "timed",
    durationMs: 40000,
    unlocksUnit: "Minotaur"
  },
  QueueShamans: {
    name: "QueueShamans",
    title: "Schamanen-Pakt",
    description: "Schamanen rekrutierbar - verheerende Magie auf Distanz.",
    kind: "timed",
    durationMs: 40000,
    unlocksUnit: "Shaman"
  },
  Skulls: {
    name: "Skulls",
    title: "Totenschwarm",
    description: "Beschwört einen Schwarm Schädel für dich.",
    kind: "instant",
    durationMs: 0
  },
  Spiders: {
    name: "Spiders",
    title: "Spinnenplage",
    description: "Beschwört giftige Riesenspinnen für dich.",
    kind: "instant",
    durationMs: 0
  },
  SpawnTurtles: {
    name: "SpawnTurtles",
    title: "Panzer-Vorstoß",
    description: "Beschwört Schildkröten, die für dich vorrücken.",
    kind: "instant",
    durationMs: 0
  },
  ConvertGoblins: {
    name: "ConvertGoblins",
    title: "Goblin-Verwandlung",
    description: "Verwandelt alle deine Lancers in Goblins.",
    kind: "instant",
    durationMs: 0
  },
  ConvertSharks: {
    name: "ConvertSharks",
    title: "Hai-Verwandlung",
    description: "Verwandelt alle deine Archer am Boden in Haie.",
    kind: "instant",
    durationMs: 0
  },
  GnomesBasic: {
    name: "GnomesBasic",
    title: "Gnomen-Fluch",
    description: "Verwandelt gegnerische Basiseinheiten am Boden in Gnome.",
    kind: "instant",
    durationMs: 0
  },
  MinotaurRage: {
    name: "MinotaurRage",
    title: "Minotaurus-Zorn",
    description: "Je 3 Gegner-Monster: ein Minotaurus (mind. einer).",
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

/** Queue boosts temporarily unlock one monster for recruitment. */
export function isQueueBoost(name: BoostName): boolean {
  return CORE_BOOSTS[name].unlocksUnit !== undefined;
}

export function queueBoostUnit(name: BoostName): UnitName | undefined {
  return CORE_BOOSTS[name].unlocksUnit;
}
