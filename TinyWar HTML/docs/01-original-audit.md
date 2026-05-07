# Original Audit

Audit-Datum: 2026-05-06

## Projektidentitaet

TinyWar ist ein schneller Echtzeit-Auto-Battler. Zwei Spielerkaempfe laufen auf einer kleinen Karte. Ziel ist die Zerstoerung der gegnerischen Basis. Einheiten spawnen kontinuierlich aus Basen, laufen ueber drei Lanes, kaempfen automatisch, und Spieler steuern Queue, Lane-Auswahl, Boosts und Strategie.

## Tech Stack Original

- Sprache: Rust 2021
- Engine: Bevy `0.18.0`
- Map: `bevy_ecs_tiled`, Tiled TMX
- Audio: `bevy_kira_audio`
- Networking ausserhalb WASM: `bevy_renet`
- Persistence/Settings: Rust/Serde-Strukturen
- Lizenz: MIT, Copyright 2026 Mavs

## Code-Struktur

Relevante Originalmodule:
- `src/core/units/units.rs`: Unit-Namen, Stats, Animation-Frames, Spawn-Dauer, Speed, Range, Projektile.
- `src/core/units/buildings.rs`: Gebaeude, Groessen, Health, Spawn-Offsets.
- `src/core/boosts.rs`: 48 Boosts, Bedingungen, Dauer und Aktivierungseffekte.
- `src/core/player.rs`: Player-Seite, Lane-Auswahl, Strategie, Queue, Boost-Slots.
- `src/core/mechanics/combat.rs`: Damage-Formel, Projektile, Attack-Resolution.
- `src/core/mechanics/movement.rs`: Pathing, Bewegung, Kollision, Strategieverhalten.
- `src/core/mechanics/spawn.rs`: Gebaeude-, Unit- und Projektil-Spawn.
- `src/core/map/map.rs`: Lane-/Map-Daten.
- `src/core/map/ui/systems.rs`: Grosser UI-Bereich, muss vor Implementierung weiter zerlegt werden.

## Assets

Assets liegen unter `assets`:
- `audio`: `button`, `click`, `defeat`, `error`, `explosion`, `horn`, `message`, `music`, `victory`, `warning` als OGG.
- `fonts`: `FiraMono-Medium.ttf`, `FiraSans-Bold.ttf`.
- `map`: `map.tmx`, TSX-Dateien und Tiles/Decorations.
- `images/bg`: Cover, Background, Victory/Defeat, vier Scenery-Bilder.
- `images/buildings`: Farben Black, Blue, Purple, Red, Yellow; je Archery, Barracks, Castle, House1-3, Monastery, Tower.
- `images/units`: Spielerfarben Black, Blue, Purple, Red, Yellow mit Warrior, Lancer, Archer, Priest Animationen.
- `images/units/Monsters`: Bear, Gnoll, Gnome, Goblin, Hammerhead, Minotaur, Shaman, Shark, Skull, Snake, Spider, Troll, Turtle.
- `images/boosts`: 48 Boost-Icons plus aktive/selektierte/Enemy-Varianten.
- `images/icons`: Stats, Strategien, Sound/Music/Mute und Lane-Pfeile.
- `images/ui`: Banner, Ribbons, Swords.
- `images/effects`: Dust, Explosion, Fire, Heal, Splash.

## Map

`assets/map/map.tmx`:
- Orientation: orthogonal
- Groesse: 30 x 16 Tiles
- Tilegroesse: 64 x 64
- Layer: `foam`, `Tile Layer 3`, `obj3`, `Tile Layer 2`, `obj2`, `Tile Layer 1`, `obj`
- Tilesets: Terrain, Foam, Rocks, Bushes, Trees, Stumps, Sheep.

Map-Rendering-Diagnose 2026-05-06:
- `scripts/diagnose-map.mjs` prueft TMX/TSX-Struktur gegen generiertes `mapData.ts`.
- Diagnose-Befund: 15 animierte Tilesets sind vorhanden.
- HTML-Fix 2026-05-07: `MapRenderer` spielt TSX-Tile-Animationen mit den exportierten Frame-Dauern ab. Diese Korrektur wechselt nur den Frame bestehender Tile-Images; Layer, Positionen und TMX-Daten bleiben unveraendert.
- Diagnose-Befund: 2 TMX-GIDs haben Tiled-Flip-Flags: Layer `obj` an `(6,11)` und `(23,12)`, jeweils `Sheep_Idle` horizontal gespiegelt.
- HTML-Fix 2026-05-06: `generate-map-data.mjs` maskiert Tiled-Flip-/Rotation-Bits aus den GIDs und speichert Flags separat in `tileFlags`; `MapRenderer` wendet horizontal/vertical Flip auf die betroffenen Tiles an. Diagonal/Hex-Rotation wird bewusst nur gewarnt, weil aktuell keine solchen Tiles in der Map vorkommen.
- Anchor-/Offset-Diagnose 2026-05-07: `diagnose-map` gruppiert Non-64x64-Placements nach Layer/Tileset und berechnet den sichtbaren Zell-Footprint nach Tiled-Bottom-Left-Anker. Befund: 87 Placements, davon 64 Foam und 23 Nicht-Foam; 9 Placements werden an Map-Grenzen geclippt. Es gibt keine `tileoffset`-Tags in der TMX/TSX-Quelle. Korrekturen duerfen deshalb nur gezielt nach visueller Pruefung der gemeldeten Footprints passieren, nicht pauschal.
- HTML-Debug 2026-05-07: `MapDebugOverlay` kann per Taste `M` Grid-Koordinaten und Non-64x64-Footprints anzeigen. Rot markiert geclippte Placements, Gelb Nicht-Foam und Blau Foam. Das Overlay ist Diagnose-only und veraendert keine Mapdaten.
- Map-Korrektur 2026-05-07: Zwei manuell gepruefte Baum-Anker wurden in `map.tmx` verschoben: `obj` Tree3 von `(27,7)` nach `(26,7)` und `obj2` Tree1 von `(19,2)` nach `(20,2)`. Foam wurde nicht geaendert, weil die gemeldeten Foam-Koordinaten bereits bestehende Anker/Footprints betreffen und erst als eindeutige Ankerliste bestaetigt werden muessen.
- Map-Korrektur 2026-05-07: Tree3-Anker `obj` von `(1,13)` nach `(1,14)` verschoben, damit der sichtbare Baum bei `(2,13)` ein Feld tiefer sitzt.
- Map-Testkorrektur 2026-05-07: Foam-Anker `foam` von `(1,10)` nach `(1,8)` verschoben. Hintergrund: Der sichtbar bei `(2,9)` beanstandete Foam stammt von diesem 3x3-Footprint; Ziel ist eine visuelle Pruefung, ob der Foam dadurch bei `(2,7)` korrekt sitzt, ohne Cliff-Layer zu ueberdecken.

## Units

Unit-Typen:
- Basic: Warrior, Lancer, Archer, Priest
- Boost/Monster: Bear, Gnoll, Gnome, Goblin, Hammerhead, Minotaur, Shaman, Shark, Skull, Snake, Spider, Troll, Turtle

Wichtige Regeln:
- Nur Basic Units sind initial queuebar.
- Weitere Units werden ueber Queue-Boosts freigeschaltet.
- Priest heilt mit negativem physischem Schaden und greift nicht an.
- Ranged Units: Archer, Gnoll, Shaman, Shark.
- Guard-faehig: Warrior, Minotaur, Skull, Turtle.

## Buildings

Gebaeude:
- Barracks: Health 1000, zwei Unit-Slots.
- Castle: Health 2000, drei Unit-Slots.
- Tower: Health 500, ein Unit-Slot.

## Phase 1-3 Source Audit

Status: abgeschlossen fuer Map, Bases, Basic-Units, Queue-Grunddaten, Lane-Auswahl und ersten Movement-Slice. Nicht abgeschlossen fuer Combat-Spezialfaelle, Boosts, komplette UI und Solo-AI.

Gepruefte Originaldateien:
- `src/core/map/map.rs`
- `src/core/mechanics/movement.rs`
- `src/core/mechanics/spawn.rs`
- `src/core/units/units.rs`
- `src/core/units/buildings.rs`
- `src/core/player.rs`

Ergebnisse:
- `map.rs`: Mapgroesse 30x16, Tilegroesse 64, Map-Position, Start-Tiles `(3,0)` und `(27,0)`, Walkability-Bitmask, 8-Wege-Nachbarn mit Corner-Cut-Verbot und Lane-Waypoints Top `(14,2)`, Mid `(14,6)`, Bot `(14,10)` sind die Quelle fuer den HTML-Core.
- `movement.rs`: Originalbewegung folgt der Lane bis zum naechsten Ziel-Tile, reversed den Pfad fuer die rechte Seite, stoppt am Lane-Ende, prueft Einheiten/Gebaeude in umliegenden Tiles, setzt Attack/Heal statt Bewegung und nutzt Separation gegen Kollisionen. Im HTML-Slice umgesetzt sind Pfadfolge, rechte-Seite-Reversal, Stop am Lane-Ende, Attack-Stop und Priest-Heal-Stop. Noch offen sind vollstaendige Separation, March/Frozen/NoCollision und Strategieeffekte.
- `spawn.rs`: Units spawnen ohne Positionsangabe an der Base-Tuer `base.y - 70`; Building-Units spawnen auf Building-Slots; Buildings erzeugen Healthbars; Despawn eines Buildings entfernt Units auf dem Building. Im HTML-Slice umgesetzt sind Base-Spawns, Building-Slots fuer Barracks, Healthbars und Unit-Despawn. Noch offen sind Dust/Click-Info, Projektile und Building-Despawn-Folgeeffekte.
- `units.rs`: Basic-Unit-Werte Warrior, Lancer, Archer und Priest fuer Health, Damage, Armor, Magic Resist, Penetration, Speed, Range, Spawn-Dauer, Frames und Projektile wurden als Quelle genutzt. Bewusste HTML-Trennung: `renderSize` und `worldSize`, damit der Lancer optisch original gross bleibt, ohne seine Gameplay-Kollisionsgroesse zu verfaelschen.
- `buildings.rs`: Barracks/Castle/Tower Groessen, Health und Unit-Slot-Offsets wurden uebernommen.
- `player.rs`: Side Left/Right, PlayerDirection-Reihenfolge, `next`, `previous`, Lane-Mapping und Strategie-Namen Attack/Guard/March/Berserk wurden geprueft. Umgesetzt sind Side, Direction-Reihenfolge und Lane-Mapping. Strategien bleiben Milestone 6.

Wichtige Korrektur:
- Die fruehe Roadmap-Checkbox war zu lange offen und haette vor groesseren Milestone-4/5-Arbeiten formal geschlossen oder als Blocker gemeldet werden muessen. Der Code war nicht ohne Originalabgleich gebaut, aber die Nachvollziehbarkeit in der Roadmap war schwach.

## Combat

Damage-Formel:
- Effective Armor = `max(0, defender.armor - attacker.armorPen)`
- Effective Magic Resist = `max(0, defender.magicResist - attacker.magicPen)`
- Physical Damage = `attacker.physicalDamage * (10 / (10 + effectiveArmor))`
- Magic Damage = `attacker.magicDamage * (10 / (10 + effectiveMagicResist))`
- Total Damage = `max(5, physicalDamage + magicDamage)`

Wichtig: Schaden wird am Ende der Attack-Animation angewendet, nicht beim Start.

Attack-Timing-Details aus `combat.rs`/`units.rs`:
- Original loest Schaden/Projektil/Heal in `resolve_attack` ueber Bevy `CycleCompletedEvent` der laufenden Attack- bzw. Heal-Animation aus.
- Basic-Unit-Cycle-Laengen aus `UnitName::frames` bei 100ms pro Frame: Warrior Attack 800ms, Lancer Attack 900ms, Archer Attack 600ms, Priest Heal 1100ms.
- HTML-Stand 2026-05-06: Der Core startet bei Target-in-Range erst einen Attack-Cycle und wendet Schaden erst nach der originalen Cycle-Laenge an. Der Renderer spielt Attack-/Heal-Spritesheets fuer Basic Units ab. Noch offen: direkte Kopplung an ein echtes Phaser-Animation-Complete-Event sowie Projektil-/Heal-Resolution nach demselben Eventmodell.

Range- und Facing-Details aus `movement.rs`, `units.rs`, `units/systems.rs`, `constants.rs`:
- `RADIUS = UNIT_DEFAULT_SIZE * UNIT_SCALE * 0.5 = 48`.
- Ranged-Interaktion nutzt `unit.range(player) * RADIUS`; Archer/Priest/Shark haben Range 3, Gnoll/Shaman 2.5.
- Melee-Units nutzen Nahkampf-/Separation-Distanz statt Ranged-Reichweite.
- Beim Attack/Heal auf Units setzt das Original `flip_x` anhand der Zielposition: Ziel links vom Angreifer bedeutet gespiegelt/links schauen.
- HTML-Stand 2026-05-06: Archer startet den Attack-Cycle auf 3 * 48px Distanz statt erst in Melee-Range. Combat-Facing wird im Renderer anhand der gelockten Zielposition gesetzt. Projektilflug und echter Projectile-Impact bleiben offen.

Projectile-Details aus `combat.rs`, `movement.rs`, `spawn.rs`:
- Archer spawnt am Ende der Attack-Animation `Projectile::Arrow`; direkter Schaden wird fuer Projectile-Units nicht angewendet.
- Arrow-Speed ist 160 World-Units pro Sekunde.
- Arrow-Startposition ist Angreiferposition plus `0.25 * RADIUS` in Zielrichtung und `0.25 * RADIUS` nach oben.
- Arrow fliegt parabolisch zur Zielposition; Parabelhoehe ist `progress * (1 - progress) * 4 * total_distance * 0.2`.
- Treffer pruefen Gegner in umliegenden Tiles mit Distanz `< RADIUS * 0.4`; getroffene Projectile werden despawned.
- Parabolische Projectiles bleiben nach Landung 2 Sekunden am Boden.
- HTML-Stand 2026-05-06: Arrow-Projectile fuer Archer ist als Core-State und Phaser-Renderer umgesetzt: Spawn am Attack-Cycle-Ende, parabolische Bewegung, Collision-Damage, Despawn und sichtbares Original-Arrow-Asset. Noch offen: Tile-basierte Nachbarschaftsoptimierung wie im Original, Boden-Clipping des gelandeten Pfeils, sowie Bone/Magic/Harpoon fuer spaetere Monster-Units.

Priest-Heal-Details aus `movement.rs`, `combat.rs`, `units.rs`, `units/systems.rs`:
- Priest greift nicht an; bei verletzten Allies in Range setzt Movement `Action::Heal(target)`.
- Priest kann sich laut Originalbeschreibung nicht selbst heilen.
- Heal-Range nutzt wie Archer `unit.range(player) * RADIUS = 3 * 48`.
- Am Ende der Heal-Animation wird `physical_damage = -30` als negativer Schaden angewendet und Health wird auf `0..maxHealth` geklemmt.
- Heal-Action bleibt nur gueltig, solange das Ziel existiert, in Range ist und weiterhin unter Max-Health liegt.
- HTML-Stand 2026-05-06: Priest-Heal ist im Core umgesetzt: verletzte Allies werden gelockt, Self-Heal/Enemy-Attack/Full-Health-Heal sind ausgeschlossen, Heal wird nach 1100ms Cycle angewendet und auf Max-Health geklemmt. Meditation-Boost-Verstaerkung bleibt bis Boost-System offen.

## Bekannte Audit-Luecken

Vor Coding muessen noch final verifiziert werden:
- UI-Positionen und Zustandslogik aus `src/core/map/ui/systems.rs`;
- KI/Solo-Verhalten;
- Solo-/AI-Verhalten, da Multiplayer fuer den HTML-Rebuild bewusst nicht im Scope ist;
- genaue Animation-Slicing-Daten pro Spritesheet;
- Asset-Herkunft/Lizenzhinweise ueber die MIT-Lizenz hinaus, falls externe Assetpacks enthalten sind.

## Solo Enemy Queue

Originalquelle: `src/core/mechanics/queue.rs`.

- Beide Spieler loesen ihre Queue ueber `queue_resolve` auf.
- Wenn ein Queue-Slot leer ist, wird fuer den Spieler direkt wieder `queue_default` queued.
- Im Singleplayer waehlt der Enemy nach jedem Spawn eine neue queuebare Unit zufaellig.
- Die Auswahl ist gewichtet mit inverser Spawn-Dauer: `weight = 1.0 / unit.spawn_duration()`.
- HTML-Stand 2026-05-06: Die vorherige deterministische Basic-Unit-Rotation wurde ersetzt durch gewichtete Zufallsauswahl aus aktuell verfuegbaren Basic Units Warrior, Lancer, Archer, Priest. Queue-Unlocks fuer Monster folgen spaeter mit dem Boost-System.
