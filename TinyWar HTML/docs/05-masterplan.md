# Masterplan

## Phase 0: Projekt-Sicherung und Audit-Abschluss

Ziel: Keine Implementierung ohne belastbare Parity-Spezifikation.

Arbeitspakete:
1. Original lokal lauffaehig pruefen oder mindestens Headless/Build-Status dokumentieren.
2. `src/core/map/map.rs`, `src/core/map/ui/systems.rs`, `src/core/mechanics/*`, `src/core/boosts.rs` vollstaendig auditieren.
3. Unit-, Building-, Boost- und Animationstabellen aus Rust in Markdown oder JSON-Spec uebertragen.
4. Asset-Lizenz und MIT-Hinweis fuer Kopien dokumentieren.
5. Multiplayer explizit aus Scope halten; alle Planungen auf Solo-Spiel ausrichten.

Exit-Kriterien:
- `02-feature-parity-table.md` hat keine kritischen `Audit`-Luecken fuer Phase 1.
- UI-Parity ist fuer Mobile/Desktop freigegeben.
- Architekturentscheidung ist bestaetigt.

## Phase 1: HTML5-Projektskelett

Ziel: Saubere Grundlage ohne Gameplay-Godfile.

Arbeitspakete:
1. Vite + TypeScript + Phaser initialisieren.
2. Assets nach `public/assets/tinywar` kopieren, MIT-Lizenz beilegen.
3. Asset-Manifest fuer Images, Audio, Fonts, TMX/JSON erstellen.
4. Phaser Boot/Preload/Game Scene minimal aufsetzen.
5. Test-Runner fuer Pure-Core einrichten.

Exit-Kriterien:
- Build laeuft.
- Dev-Server laeuft.
- Eine leere Scene laedt Fonts, Audio und mindestens ein Sprite.
- Keine Datei verletzt Architekturgrenzen.

## Phase 2: Daten- und Core-Parity

Ziel: Originalregeln ohne Rendering implementieren.

Arbeitspakete:
1. Unit-, Building- und Player-Daten uebertragen.
2. Damage, Targeting-Grundmodell, Queue, Strategy, Boost-Slots als Pure-Core bauen.
3. Regressionstests gegen Originalwerte schreiben.
4. Keine visuelle Komplexitaet, bevor Core-Tests stehen.

Exit-Kriterien:
- Unit-Stats entsprechen Original.
- Damage-Tests bestehen.
- Queue/Strategy/Boost-Slot-Tests bestehen.

## Phase 3: Map und Bewegung

Ziel: Originalkarte und Lane-Bewegung sichtbar und spielbar.

Arbeitspakete:
1. TMX direkt laden oder deterministisch zu Phaser Tilemap JSON konvertieren.
2. Layer-Reihenfolge und Z-Indizes abbilden.
3. Lane-Pfade, Spawnpunkte und Base-Positionen uebertragen.
4. Unit-Bewegung, Kollision und Kamera implementieren.

Exit-Kriterien:
- Karte sieht strukturell wie Original aus.
- Units koennen alle drei Lanes laufen.
- Mobile Drag/Pinch und Desktop WASD/Scroll funktionieren.

## Phase 4: Combat und Rendering

Ziel: Vollstaendiger Kampf-Loop.

Arbeitspakete:
1. Spritesheet-Manifeste fuer alle Aktionen.
2. Idle/Run/Attack/Guard/Heal Animationen.
3. Target Lock, Range Check, Attack Timing, Projektile.
4. Healthbars, Damage, Healing, Death/Despawn.
5. Base-Damage und Sieg/Niederlage.

Exit-Kriterien:
- Basic Units kaempfen korrekt.
- Priest heilt korrekt.
- Archer/Gnoll/Shaman/Shark Projektile funktionieren.
- Base-Zerstoerung beendet das Spiel.

## Phase 5: UI, Queue, Strategien, Boosts

Ziel: Original-Spielsteuerung vollstaendig.

Arbeitspakete:
1. Queue-UI und Unit-Auswahl.
2. Lane-Auswahl mit 7 Modi.
3. Strategie-UI und 5s Cooldown.
4. Boost-Draft alle 30s.
5. Alle 48 Boosts gruppiert implementieren: Stat-Mods, Queue-Unlocks, Spawns, Conversions, Building-Effekte, Movement/Collision-Effekte.
6. Audio-Events und Settings.

Exit-Kriterien:
- Boost-Liste ist komplett.
- Keine stille Balance-Aenderung.
- Mobile und Desktop UI bestehen Screenshot-Checks.

## Phase 6: Solo-/AI-Finalisierung

Ziel: Solo-Spiel sauber abschliessen.

Arbeitspakete:
1. AI-/Enemy-Verhalten aus Original auditieren und portieren.
2. Alle Multiplayer-Menues, Netzwerkpfade und Host/Client-Regeln aus dem HTML-Scope entfernen oder durch Solo-sinnvolle Regeln ersetzen.
3. Game-Speed, Pause und Debug-Funktionen fuer Solo definieren.
4. Start-/Endfluss fuer Solo-Version finalisieren.

Stop: Keine Netzwerk-, Lobby-, WebSocket-, WebRTC- oder Account-Arbeit einbauen.

## Phase 7: Polish und Release

Ziel: Browser-taugliche, mobile-first Version ohne Parity-Verlust.

Arbeitspakete:
1. Performance auf Mobile testen.
2. Asset Preload, Loading Screen, Audio-Unlock fuer Mobile.
3. PWA nur wenn sinnvoll und nicht vor Gameplay-Parity.
4. Regressionstest-Suite und visuelle Smoke-Tests.
5. README, Lizenz, Quellen, Build/Run-Anleitung.

Exit-Kriterien:
- Build reproduzierbar.
- Mobile Browser spielbar.
- Dokumentierte bekannte Abweichungen sind explizit freigegeben.
