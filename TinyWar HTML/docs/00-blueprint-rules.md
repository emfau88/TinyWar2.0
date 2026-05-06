# Blueprint Rules

Diese Regeln stammen aus dem Parity Rebuild Blueprint und gelten fuer jede weitere Arbeit in diesem Projekt.

## Core Principle

Das Originalprojekt ist die Quelle der Wahrheit. Verbesserungen duerfen Struktur, Tooling, Testbarkeit und Mobile-Ergonomie betreffen, aber nicht das Spielverhalten ohne explizite Freigabe veraendern.

## Mandatory Rules

1. Keine Interpretation ohne Freigabe.
2. Kein Coding vor vollstaendigem Audit.
3. Alle Features werden zuerst identifiziert.
4. UI-Struktur muss dem Original entsprechen.
5. Keine Micro-Tasks.
6. Bei Unklarheit stoppen und fragen.
7. Keine Framework-Voreingenommenheit.

## Required Workflow

1. Originalprojekt auditieren.
2. Feature-Parity-Tabelle erstellen.
3. UI-Parity definieren.
4. Architektur waehlen.
5. Masterplan erstellen.
6. Erst danach implementieren.

## Stop Conditions

Sofort stoppen, wenn:
- Originaldaten fehlen.
- Verhalten unklar ist.
- Anweisungen widerspruechlich sind.
- mehrere plausible Interpretationen existieren.
- eine vorgeschlagene Vereinfachung Originalverhalten brechen wuerde.

## Codex-Verhalten

Codex muss dich bremsen, wenn eine Idee die Parity gefaehrdet, etwa:
- "Wir bauen erstmal nur etwas Aehnliches."
- "Mobile First bedeutet anderes UI."
- "Multiplayer doch wieder nebenbei einbauen."
- "Wir ersetzen die Tiled-Map durch eine frei erfundene Map."
- "Boosts/Stats werden spaeter balanciert."

Solche Entscheidungen brauchen eine explizite Freigabe und muessen dokumentiert werden.
