# Implementation Playbook for Codex

Diese Datei ist die Arbeitsanweisung fuer Codex bei jeder spaeteren Umsetzung.

## Arbeitsmodus

1. Vor jeder Codeaenderung relevante Originaldateien lesen.
2. Bestehende Docs aktualisieren, wenn neue Parity-Erkenntnisse entstehen.
3. Nur zusammenhaengende Arbeitspakete umsetzen, keine Alibi-Micro-Tasks.
4. Nach jedem Paket bauen/testen/screenshotten, passend zum Risiko.
5. Bei Unsicherheit stoppen und konkrete Frage stellen.

## Warnpflicht

Codex muss proaktiv warnen, wenn:
- ein Vorschlag Originalverhalten veraendert;
- eine Abkuerzung spaetere Parity teurer macht;
- Mobile-Ergonomie mit Original-UI kollidiert;
- Netzwerk-/Multiplayer-Arbeit wieder in den Scope rutscht;
- eine Datei zu gross oder zu breit wird;
- Daten doppelt gepflegt werden;
- ein Asset/Lizenzthema unklar ist.

Formulierung: direkt und konkret. Beispiel: "Das ist eine schlechte Idee, weil es die Boost-Parity bricht. Sicherer waere ..."

## Coding-Regeln

- TypeScript strict.
- Pure Gameplay-Core ohne Phaser-Importe.
- Phaser nur fuer Rendering, Assets, Input und Scene Lifecycle.
- Keine Godfiles.
- Keine Magic Strings fuer Assets.
- Keine Balancing-Aenderungen ohne dokumentierte Freigabe.
- Keine neuen Features vor Parity-MVP.
- Keine entfernten Features nur weil sie auf Mobile schwieriger sind.

## Datei-Grenzen

Richtwerte:
- Scene-Dateien: max. 250 Zeilen.
- Core-Systeme: max. 300 Zeilen.
- UI-Komponenten: max. 250 Zeilen.
- Datenmanifeste duerfen laenger sein, muessen aber generiert/strukturiert bleiben.

Wenn ein Limit ueberschritten wird:
1. nicht weiter Feature-Code in dieselbe Datei schreiben;
2. Verantwortlichkeiten benennen;
3. Datei in klare Module splitten;
4. Tests erneut ausfuehren.

## Verifikation

Minimal pro Paket:
- `npm run build`
- relevante Unit-Tests
- Browser-Smoke-Test fuer sichtbare Gameplay-/UI-Aenderungen

Pflicht bei UI/Canvas:
- Screenshot Desktop und Mobile.
- Canvas-Pixelcheck gegen blank screen.
- Asset-Load-Fehler pruefen.

Pflicht bei Gameplay:
- Core-Test fuer neue Regel.
- Vergleich mit Originalcode-Stelle in Commit-/Arbeitsnotiz.

## Stop-Liste

Nicht weitermachen, wenn:
- Originalcode anders ist als die bisherige Spec;
- Boost/Unit/Map-Daten fehlen;
- eine Entscheidung mehrere plausible Wege hat;
- ein Test fehlt, der eine zentrale Regel absichert;
- eine UI-Aenderung Originalstruktur aufloest;
- eine Implementierung nur "ungefaehr" dem Original entspricht.

Dann kurze Frage stellen und Optionen mit Risiko nennen.
