# Architecture

## Empfehlung

Empfohlenes Setup: Vite + TypeScript + Phaser 3.

Begruendung:
- Phaser ist fuer HTML5-2D, Spritesheets, Audio, Input und Mobile-Browser gut geeignet.
- Tiled/TMX laesst sich mit Phaser oder Build-Konvertierung nach JSON verwenden.
- TypeScript erlaubt einen getesteten Gameplay-Core ohne Engine-Abhaengigkeit.
- Vite liefert schnelles lokales Arbeiten und einfache Mobile-Tests.

Nicht fest vor dem Audit:
- Ob TMX direkt geladen oder vorab konvertiert wird.
- Ob UI komplett in DOM, Phaser UI oder Hybrid gebaut wird.

## Zielstruktur

```text
TinyWar HTML/
  docs/
  public/
    assets/
      tinywar/
  src/
    game/
      scenes/
      systems/
      render/
      input/
    core/
      combat/
      movement/
      queue/
      boosts/
      units/
      buildings/
      map/
      player/
    data/
      units.ts
      boosts.ts
      buildings.ts
      animation-manifest.ts
      asset-manifest.ts
    ui/
      components/
      overlays/
    tests/
```

## Architekturgrenzen

- `src/core`: reine Logik, keine Phaser-Imports.
- `src/data`: aus Rust-Audit uebertragene Konstanten und Manifeste.
- `src/game`: Phaser-Szenen und Bridge zwischen Core-State und Darstellung.
- `src/ui`: DOM/Phaser-UI-Komponenten, keine Gameplay-Regeln.
- `src/tests`: Core-Regressionstests, besonders Damage, Queue, Boosts, Strategy.

## Godfile-Verbot

Harte Grenzen:
- Keine Datei ueber 400 Zeilen ohne Review.
- Keine Scene mit Gameplay-Regeln, UI und Asset-Manifest zugleich.
- Kein globaler mutable State ausser einem klaren `GameState`/Store.
- Keine String-basierten Asset-Zugriffe ausserhalb des Asset-Manifests.
- Keine duplizierten Unit-/Boost-Stats in mehreren Dateien.

Wenn eine Datei zu gross wird, muss vor dem naechsten Feature geschnitten werden:
- Daten in `src/data`.
- Pure Systems in `src/core`.
- Rendering in `src/game/render`.
- Input Mapping in `src/game/input`.
- Overlay-Komponenten in `src/ui`.

## Teststrategie

Pflichttests vor spielbarer Freigabe:
- Damage-Formel inklusive Minimum 5.
- Armor/Magic-Resist/Penetration.
- Queue-Laenge und Queue-Freischaltungen.
- Strategy-Cooldown 5s.
- Boost-Dauer und Slotlimit 4.
- Building-Health und Game-Over bei Base-Zerstoerung.

Browser-Verifikation:
- Dev-Server starten.
- Mobile und Desktop Viewports testen.
- Canvas darf nicht blank sein.
- Assets muessen aus lokalem `public/assets/tinywar` kommen.
