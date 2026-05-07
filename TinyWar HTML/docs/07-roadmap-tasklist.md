# Concrete Roadmap and Tasklist

Ziel: TinyWar als HTML5-Mobile-First-Solo-Spiel nachbauen. Kein Multiplayer. Keine Lobby. Kein Netzwerk. Der Plan erzeugt frueh sichtbare Builds, ohne das Fundament kaputtzusparen.

## Leitentscheidung

Der optimale Weg ist ein vertikaler Slice, aber mit sauberem Core:
1. Sehr frueh eine sichtbare Phaser-Version mit echter Originalkarte und Assets.
2. Gleichzeitig Gameplay-Regeln im Pure-Core halten, damit spaetere Boosts/Combat nicht in einer Scene-Datei versinken.
3. Features in groesseren, sichtbaren Paketen liefern: Map, Movement, Combat, UI, Boosts.

Nicht optimal waere ein monatelanger Daten-Audit ohne Build. Ebenfalls schlecht waere ein schneller Phaser-Prototyp mit erfundenem Verhalten. Dieser Plan vermeidet beides.

## Scope

In Scope:
- HTML5 Browser-Spiel.
- Mobile First mit Desktop-Unterstuetzung.
- Phaser 3 + Vite + TypeScript, sofern keine harte Blockade auftaucht.
- Original-Assets aus TinyWar.
- Solo-Modus gegen AI/Enemy.
- Original-Spielregeln, soweit fuer Solo relevant.
- Original-UI-Struktur mit mobilen Bedienhilfen.

Out of Scope:
- Multiplayer.
- Lobby, Server, WebSocket, WebRTC.
- Accounts, Matchmaking, Remote Sync.
- Redesign oder Rebalancing.
- neue Units, neue Boosts, neue Maps vor Parity.

## Milestone 0: Audit Lock and Project Bootstrap

Ziel: genug wissen, um stabil zu bauen, ohne noch alle 48 Boosts fertig verstanden zu haben.

Tasks:
- [x] Multiplayer aus allen Planungsdokumenten als Out of Scope markieren.
- [x] Originaldateien fuer Phase 1-3 auditieren: `map.rs`, `movement.rs`, `spawn.rs`, `units.rs`, `buildings.rs`, `player.rs`.
- [x] Offene Fragen zu Solo-AI markieren, aber nicht Phase 1 blockieren.
- [x] Vite + TypeScript + Phaser installieren.
- [x] Projektstruktur nach `04-architecture.md` anlegen.
- [x] TinyWar-Assets nach `public/assets/tinywar` kopieren.
- [x] MIT-Lizenz ins Zielprojekt aufnehmen.
- [x] Build-Script, Dev-Script und Test-Script einrichten.

Build-Ergebnis:
- Browser oeffnet eine Phaser-Scene.
- Loading funktioniert.
- Ein Original-Background oder Sprite ist sichtbar.

Exit-Kriterien:
- `npm run build` erfolgreich.
- Keine Godfile-Struktur.
- Assetpfade laufen ueber Manifest.

Status 2026-05-06:
- Build erfolgreich.
- Tests erfolgreich: Damage-Core mit 2 Tests.
- 434 Original-Assetdateien nach `public/assets/tinywar` kopiert.
- Erste Phaser-Szene laedt Background, Banner und Blue Warrior ueber Asset-Manifest.
- Dev-Server gestartet: `http://localhost:5175/`.
- Phase-1-bis-3-Source-Audit formal nachgezogen und dokumentiert in `docs/01-original-audit.md`: Map, Movement, Spawn, Units, Buildings und Player. Ergebnis: aktueller HTML-Slice ist weiter auf Kurs; offene Abweichungen sind Kollision/Separation, Strategien, Priest-Heal, Projektile, Boosts, UI-Details und Solo-AI.

## Milestone 1: Original Map Visible

Ziel: frueh sichtbarer Fortschritt mit echter TinyWar-Identitaet.

Tasks:
- [x] TMX-Ladestrategie entscheiden: direkt laden oder Build-Konvertierung nach JSON.
- [x] `map.tmx` und Tilesets in Phaser darstellen.
- [x] Layer-Reihenfolge aus Original abbilden.
- [x] Kamera auf Map zentrieren.
- [x] Mobile Drag und Desktop WASD einbauen.
- [x] Zoom per Pinch/Scroll mit Originalgrenzen vorbereiten.

Build-Ergebnis:
- Die Originalkarte ist im Browser sichtbar und bewegbar.

Exit-Kriterien:
- Map ist nicht nachgebaut, sondern aus Originaldaten geladen/konvertiert.
- 360x640 und Desktop sind sichtbar nutzbar.
- Keine Gameplay-Logik in der Map-Render-Datei.

Status 2026-05-06:
- `scripts/generate-map-data.mjs` konvertiert `public/assets/tinywar/map/map.tmx` in `src/data/generated/mapData.ts`.
- Phaser rendert die Original-Layer in TMX-Reihenfolge mit Original-Tileset-Bildern.
- Animierte Tiles werden aus den TSX-Animationsdaten mit Original-Frame-Dauern abgespielt.
- Map-Diagnose-Tooling ergaenzt: `npm run diagnose:map` meldet animierte Tilesets, Tiled-Flip-Flags und Non-64x64-Placements inklusive Layer-/Tileset-Gruppierung, Tiled-Bottom-Left-Footprints und Map-Grenz-Clipping.
- Debug-Overlay per Taste `M` ergaenzt: Grid-Koordinaten und Non-64x64-Footprints sichtbar, geclippte Placements rot markiert.
- Erste manuelle Map-Korrektur: zwei visuell gepruefte Baum-Anker verschoben; Foam-Korrektur bewusst zurueckgestellt, bis die Ziel-Anker eindeutig sind.
- Tiled-GID-Flip-Flags werden beim Generieren maskiert und als `tileFlags` separat gespeichert; Renderer wendet horizontal/vertical Flip an. Aktuell betrifft das zwei `Sheep_Idle` Tiles im Layer `obj`.
- Kamera ist zentriert, Touch/Mouse-Drag, WASD und Scroll-Zoom sind eingebaut.
- Build und Tests erfolgreich.

## Milestone 2: Bases and Spawn Skeleton

Ziel: Spielzustand sichtbar machen, ohne Combat-Komplexitaet.

Tasks:
- [x] Building-Daten uebertragen: Barracks, Castle, Tower.
- [x] Base-Positionen aus Original auditieren.
- [x] Linke/rechte Seite und Spielerfarben definieren.
- [x] Barracks/Base mit Original-Building-Assets rendern.
- [x] Health-Werte im Core halten.
- [x] Debug-Spawn fuer Basic Units einbauen.

Build-Ergebnis:
- Zwei Basen stehen korrekt auf der Karte.
- Per Debug-Input kann eine Unit gespawnt werden.

Exit-Kriterien:
- Building-Stats durch Tests abgesichert.
- Rendering liest nur aus GameState.

Status 2026-05-06:
- Original-Startpositionen uebertragen: links Tile `(3,0)`, rechts Tile `(27,0)`.
- Solo-Startfarben: Blue gegen Red.
- Start-Bases sind Barracks mit 1000 Health.
- Barracks/Castle/Tower-Daten und Unit-Slots als Core-Daten erfasst.
- Original `with_units` Verhalten vorbereitet: Start-Barracks rendern je zwei Archer auf den Gebaeude-Slots.
- Tests erweitert: 9 Tests erfolgreich.
- Build erfolgreich.

## Milestone 3: One-Lane Movement Slice

Ziel: erster echter Gameplay-Slice.

Tasks:
- [x] Lane-Pfad fuer Mid auditieren und uebertragen.
- [x] Unit-Daten fuer Warrior und Lancer uebertragen.
- [x] Sprite-Animationen Idle/Run fuer diese Units definieren.
- [x] Movement-System im Pure-Core implementieren.
- [x] Phaser-Renderer folgt Core-Positionen.
- [ ] einfache Unit-Kollision vorbereiten, aber nur soweit noetig.

Build-Ergebnis:
- Warrior/Lancer laufen sichtbar von Base zu Base ueber Mid.

Exit-Kriterien:
- Movement ist testbar.
- Animation und Position bleiben synchron genug fuer Combat-Ausbau.

Status 2026-05-06:
- Original-Walkability-Bitmask portiert.
- Original-Lane-Waypoints portiert: Top `(14,2)`, Mid `(14,6)`, Bot `(14,10)`.
- A*-Pathfinding fuer alle drei Lanes im Core.
- Debug-Warrior laeuft sichtbar entlang der Mid-Lane.
- Warrior/Lancer Basic-Daten fuer Speed, Health und Spawn-Dauer angelegt.
- Warrior/Lancer Idle/Run-Spritesheets sind ueber ein Animation-Manifest angebunden.
- Bewegende Debug-Warrior nutzen die Original-Run-Animation.
- Movement-Stuck/Jitter-Bug behoben: Units nutzen stabilen `pathIndex`, laufen nicht mehr durch Tile-Neuberechnung rueckwaerts und stoppen am Lane-Ende.
- Kollision bleibt bewusst offen.
- Tests erfolgreich: 23 Tests.
- Build erfolgreich.

## Milestone 4: Three Lanes and Queue

Ziel: aus dem Slice wird das erkennbare TinyWar-Spielprinzip.

Tasks:
- [x] Top/Mid/Bot-Pfade vollstaendig uebertragen.
- [x] Lane-Auswahlmodi implementieren: Any, Top, TopMid, Mid, MidBot, Bot, TopBot.
- [x] Queue-Core mit Max-Laenge 10.
- [x] Basic Units Warrior, Lancer, Archer, Priest in Daten uebertragen.
- [x] Spawn-Dauern und Queue-Timer umsetzen.
- [x] Mobile Queue-UI plus Desktop-Hotkeys Z/X/C/V.

Build-Ergebnis:
- Spieler kann Basic Units queuen und Lane-Auswahl aendern.
- Units laufen auf allen drei Lanes.

Exit-Kriterien:
- Queue-Tests bestehen.
- Lane-Auswahl entspricht Original.

Status 2026-05-06:
- Alle drei Lane-Pfade aus Original-Walkability und Original-Waypoints berechnet.
- PlayerDirection portiert inklusive `next`, `previous` und Lane-Mapping.
- Debug-Scene kann mit Taste `L` durch die Original-Lane-Auswahlmodi schalten.
- Queue-Core mit Max-Laenge 10, Spawn-Dauern und Timer-Aufloesung angelegt.
- Basic-Unit-Stats fuer Warrior, Lancer, Archer und Priest aus Originaldaten uebertragen.
- Desktop-Hotkeys aktiv: `Z` Warrior, `X` Lancer, `C` Archer, `V` Priest.
- Mobile Queue-Buttons am unteren Bildschirmrand.
- Queue-Spawns erzeugen bewegende Units auf den aktuell gewaehlten Lanes.
- Tests erfolgreich: 25 Tests.
- Build erfolgreich.
- Milestone 4 abgeschlossen.

## Milestone 5: Combat MVP

Ziel: Kampf funktioniert mit Originalformel.

Tasks:
- [x] Damage-Formel exakt implementieren.
- [x] Targeting-Regel umsetzen: Target bleibt bis Tod oder Out of Range.
- [ ] Attack-Timing an Animation koppeln.
- [x] Attack-Cycle-State vorbereiten: Schaden erst nach originaler Basic-Unit-Animationsdauer.
- [x] Melee-Combat fuer Warrior/Lancer.
- [x] Archer-Projektil implementieren.
- [x] Priest-Heal implementieren, kein Self-Heal.
- [x] Healthbars und Death/Despawn.
- [x] Base-Damage und Victory/Defeat.

Build-Ergebnis:
- Ein voll spielbarer Mini-Kampf mit Basic Units.

Exit-Kriterien:
- Damage-Tests gegen Originalformel.
- Victory/Defeat erreichbar.
- Keine erfundenen Kampfwerte.

Status 2026-05-06:
- Combat-Core fuer Melee Unit-vs-Unit und Unit-vs-Building angelegt.
- Buildings werden ohne Armor/Magic-Resist behandelt, wie im Original.
- Base-Zerstoerung setzt einen Winner-State.
- Browser-Scene verbindet Queue-Spawns mit Combat-Core.
- Unit-Healthbars werden gerendert, aktualisiert und bei Despawn entfernt.
- Building-Healthbars werden nach Schaden aktualisiert.
- Tote Units werden aus Scene und Core-State entfernt.
- Enemy-Queue/Red-Spawns fuer Solo-Slice eingebaut: rote Basic Units spawnen rechts und laufen right-to-left.
- Enemy-Queue-Parity verbessert: rote Basic Units werden nicht mehr deterministisch rotiert, sondern gewichtet zufaellig nach `1 / spawnDurationMs` ausgewaehlt, wie in Original `queue.rs`.
- Refactor: HUD-Logik nach `src/game/ui/GameHud.ts` und Combat/Render-Sync nach `src/game/systems/CombatSync.ts` ausgelagert, damit `GameScene` keine Godfile-Struktur annimmt.
- Target-Lock implementiert: Einheiten behalten ihr Ziel bis Tod oder Out of Range und wechseln nicht bei jedem Tick auf ein naeheres Ziel.
- Target-Lock Out-of-Range-Clear durch Test abgesichert.
- Attack-Timing naeher ans Original gebracht: Der erste Tick startet einen Attack-Cycle, Schaden wird erst nach der originalen Basic-Unit-Animationsdauer aus `units.rs` angewendet: Warrior 800ms, Lancer 900ms, Archer 600ms, Priest-Heal-Cycle 1100ms vorbereitet. Renderer laedt und spielt Attack-/Heal-Spritesheets fuer Basic Units.
- Restabweichung: Timing nutzt noch Core-Timer mit Original-Frame-Dauer statt direktes Phaser-Animation-Complete-Event.
- Ranged-Range korrigiert: Archer startet Attack-Cycle auf Originaldistanz `3 * RADIUS` mit `RADIUS = 48`, nicht erst in Melee-Range. Tests sichern ab, dass Melee-Units diese Ranged-Distanz nicht nutzen.
- Combat-Facing korrigiert: Einheiten schauen im Kampf anhand der gelockten Zielposition in Zielrichtung; rote Units drehen sich beim Angriff auf blaue Units nicht mehr nach rechts.
- Archer-Projectile umgesetzt: Archer spawnt am Attack-Cycle-Ende ein sichtbares Arrow-Projectile statt Direktschaden, Pfeile fliegen parabolisch mit Original-Speed 160, treffen ueber `RADIUS * 0.4`, verursachen den vorberechneten Original-Damage und despawnen danach. Gelandete Pfeile bleiben kurz sichtbar.
- Combat-Core aufgeteilt: Range/Targeting/Projectile-Logik liegen in eigenen Core-Modulen, damit `combatSystem.ts` unter der Architekturgrenze bleibt.
- Priest-Heal umgesetzt: Priests suchen verletzte Allies in Originalrange `3 * RADIUS`, starten einen 1100ms Heal-Cycle, heilen danach um 30, klemmen auf Max-Health und heilen weder sich selbst noch Gegner oder Full-Health-Allies.
- Restabweichung: Meditation-Boost-Verstaerkung fuer Priest-Heal bleibt bis Boost-System offen.
- Tests erfolgreich: 44 Tests.
- Build erfolgreich.

## Milestone 6: Core UI and Strategies

Ziel: originale Spielerentscheidungen sichtbar machen.

Tasks:
- [ ] Strategie-Core: Attack, Guard, March, Berserk.
- [ ] 5s Strategy-Cooldown.
- [ ] Top-Banner/Strategieanzeige.
- [ ] Lane-Icon oben links.
- [ ] Pause und Game-Speed fuer Solo.
- [ ] Unit-Info-Panel.
- [ ] Audio-Toggle und Mobile-Audio-Unlock.

Build-Ergebnis:
- Spiel ist auf Mobile und Desktop steuerbar.

Exit-Kriterien:
- Strategieeffekte getestet.
- UI-Screenshots fuer Mobile/Desktop.

## Milestone 7: Boost System in Groups

Ziel: Boost-Parity ohne Chaos.

Tasks:
- [ ] Boost-Draft alle 30s.
- [ ] Auswahl aus 3 Boosts.
- [ ] Max 4 selected/active Boosts.
- [ ] Boost-Dauer und Timer-UI.
- [ ] Gruppe 1: reine Stat-Mods.
- [ ] Gruppe 2: Queue-Unlocks.
- [ ] Gruppe 3: Instant-Heal/Repair/Army/Lightning.
- [ ] Gruppe 4: Spawn-Boosts.
- [ ] Gruppe 5: Conversion-Boosts.
- [ ] Gruppe 6: Building-Boosts.
- [ ] Gruppe 7: Collision/Movement/Specials.

Build-Ergebnis:
- Alle Boosts sind vorhanden und gruppiert testbar.

Exit-Kriterien:
- Keine reduzierte Boost-Liste.
- Jeder Boost hat Test oder manuelle Verifikationsnotiz.
- Boost-Beschreibungen entsprechen Original.

## Milestone 8: Monsters and Full Unit Set

Ziel: alle Units im Spiel verfuegbar machen.

Tasks:
- [ ] Bear, Gnoll, Gnome, Goblin, Hammerhead, Minotaur, Shaman, Shark, Skull, Snake, Spider, Troll, Turtle Daten uebertragen.
- [ ] Animation-Manifeste fuer alle Monster.
- [ ] Projektile Bone, Magic, Harpoon.
- [ ] Guard-faehige Units korrekt behandeln.
- [ ] grosse Unit-Groessen und Collision pruefen.

Build-Ergebnis:
- Boosts koennen alle relevanten Monster/Units spawnen oder freischalten.

Exit-Kriterien:
- Alle Unit-Stats matchen Original.
- Keine Platzhalter-Sprites.

## Milestone 9: Solo AI and Game Flow

Ziel: fertiger Solo-Modus.

Tasks:
- [ ] Original-AI/Enemy-Verhalten auditieren.
- [ ] AI-Queue, Lane-Auswahl, Strategien und Boost-Nutzung implementieren.
- [ ] Startscreen/Menu auf Solo reduzieren.
- [ ] Victory/Defeat Screens mit Original-Assets.
- [ ] Settings via LocalStorage.

Build-Ergebnis:
- Spieler kann eine komplette Solo-Partie starten und beenden.

Exit-Kriterien:
- Kein Multiplayer-Menue sichtbar.
- Keine Netzwerk-Abhaengigkeit im Build.

## Milestone 10: Mobile Polish and Release Readiness

Ziel: stabil, spielbar, wartbar.

Tasks:
- [ ] Performance-Profiling auf Mobile.
- [ ] Asset-Preload und Loading-Screen.
- [ ] Touch-Zielgroessen pruefen.
- [ ] Landscape/Portrait Verhalten finalisieren.
- [ ] Regressionstests erweitern.
- [ ] README mit Run/Build/License.
- [ ] Known Deviations dokumentieren, falls freigegeben.

Build-Ergebnis:
- Reproduzierbarer Browser-Build.

Exit-Kriterien:
- `npm run build` erfolgreich.
- Mobile Screenshots ohne UI-Ueberlappung.
- Keine offenen Parity-Abweichungen ohne Freigabe.

## Priorisierte erste Arbeitswoche

Wenn wir jetzt starten, ist die optimale Reihenfolge:
1. Projekt bootstrappen: Vite, TypeScript, Phaser, Tests.
2. Assets kopieren und Manifest bauen.
3. Originalkarte sichtbar machen.
4. Basen rendern.
5. Warrior/Lancer auf Mid-Lane laufen lassen.
6. Dann erst Queue und Combat erweitern.

Das gibt schnell sichtbare Fortschritte, aber vermeidet den groessten Fehler: Gameplay-Regeln direkt in Phaser-Szenen zu vergraben.
