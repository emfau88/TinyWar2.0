# UI Parity

## Ziel

Mobile First bedeutet: Das Spiel ist auf kleinen Touchscreens nutzbar, ohne die Originalstruktur zu verlieren. Desktop-Tastatur und Maus bleiben erhalten.

## Original-UI-Struktur

Beizubehalten:
- Hauptspiel als Karte mit Einheiten, Gebaeuden, Effekten und Projektilen.
- Lane-Auswahl oben links mit Pfeil-Icon.
- Boosts oben als aktivierbare Icons.
- Enemy-Boosts nur sichtbar, wenn aktiv.
- Strategieanzeige im oberen Banner.
- Unit Queue und Unit-Auswahl als spielentscheidende Controls.
- Audio/Menu/Info Panels als Overlays oder Panels, nicht als neue Hauptscreens.
- Victory/Defeat Endzustand.

## Aktueller Rebuild-Hinweis

`images/ui/banner.png` wird im Original fuer Info-/Hover-Panels und groessere Detailbanner verwendet, nicht als dauerhaftes Debug-Label oben auf der Map. Das permanente grosse Schriftrollen-Banner wurde daher aus dem aktuellen Build entfernt. Bis die echte Strategie-/Advance-UI portiert wird, nutzt der Rebuild nur ein kleines Debug-Label fuer Lane-Auswahl.

## Mobile-First Anpassung

Erlaubt, weil additiv:
- Touch Buttons fuer Queue, Strategie, Pause, Menu, Audio und Unit Info.
- Lane-Auswahl per Tap auf Pfeil-Icon und optional horizontalem Cycle-Control.
- Kamera per Drag, Zoom per Pinch, mit Desktop Scroll/WASD als Parity.
- Bottom-safe-area fuer Unit Queue, damit Daumenbedienung moeglich ist.
- Panels als Drawer, wenn Originalinformationen sonst unlesbar waeren.

Nicht erlaubt ohne Freigabe:
- Boost Draft als komplett anderes Card-Battle-System.
- Lane-Auswahl als minimap-basierte Neuinterpretation.
- Weglassen von Desktop-Hotkeys.
- Verstecken wichtiger Kampfwerte hinter zu vielen Menuebenen.

## Viewport-Regeln

- Baseline: Portrait Mobile ab 360x640 CSS px.
- Landscape Mobile muss spielbar bleiben.
- Desktop soll Originalnaehe priorisieren.
- Canvas nutzt feste interne Weltkoordinaten und responsive Skalierung.
- UI liegt in HTML/CSS ueber dem Canvas oder als Phaser DOM Layer, aber Gameplay-Positionen bleiben in Weltkoordinaten.

## UI-Checks vor Freigabe

Jede UI-Arbeit braucht Screenshots fuer:
- 360x640 Portrait
- 390x844 Portrait
- 844x390 Landscape
- 1280x720 Desktop

Zu pruefen:
- keine ueberlappenden Controls;
- Boost- und Queue-Icons bleiben tappbar;
- Karte bleibt sichtbar;
- Text passt in Buttons/Panels;
- Healthbars sind lesbar;
- Game Over, Menu, Draft und Pause blockieren Input korrekt.
