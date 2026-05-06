# Feature Parity Table

Statuswerte:
- `Audit`: Originalverhalten muss noch weiter gelesen oder gemessen werden.
- `Spec`: Verhalten ist beschrieben, aber noch nicht implementierbar freigegeben.
- `MVP`: Muss in der ersten spielbaren HTML-Version enthalten sein.
- `Later`: Darf erst nach ausdruecklicher Phasenfreigabe spaeter kommen.

| Bereich | Originalverhalten | HTML5-Parity-Anforderung | Status |
| --- | --- | --- | --- |
| Spielziel | Gegnerische Basis zerstoeren | gleiche Sieg-/Niederlage-Bedingung | MVP |
| Spielmodus Solo | Spieler gegen Gegner/AI | einziger Zielmodus; AI/Enemy-Verhalten exakt auditieren | Audit |
| Multiplayer | Original hat Solo und Multiplayer; Native nutzt Renet | bewusst nicht im Scope; keine Netzwerkarchitektur bauen | Out of Scope |
| Map | 30x16 TMX, 64px Tiles, mehrere Layer | TMX laden oder deterministisch konvertieren, keine neu erfundene Map | MVP |
| Kamera | Pan mit WASD, Zoom mit Scroll, Grenzen | Mobile Pinch/Drag ergaenzen, Desktop-Verhalten behalten | Spec |
| Lanes | Top, Mid, Bot; 7 Auswahlmodi | gleiche Modi: Any, Top, TopMid, Mid, MidBot, Bot, TopBot | MVP |
| Queue | Max 10, Basic Units initial | gleiche Laenge und gleiche Freischaltungen | MVP |
| Basic Units | Warrior, Lancer, Archer, Priest | alle vier mit Stats, Animationen und Hotkeys/Touch UI | MVP |
| Monster Units | 13 weitere Units | durch Boosts/Spawn-Effekte verfuegbar | MVP nach Boost-Phase |
| Buildings | Barracks, Castle, Tower | gleiche Health, Groesse, Slots, Base-Flag | MVP |
| Combat | Target Lock bis Tod/Out of Range | gleiche Targeting-Regel | MVP |
| Damage | kombinierte physisch/magisch Formel, Minimum 5 | exakt gleiche Berechnung als getesteter Pure-Core | MVP |
| Attack Timing | Schaden am Ende der Animation | Animationszeit darf Gameplay nicht entkoppeln | MVP |
| Projectiles | Arrow, Bone, Magic, Harpoon | gleiche Fluglogik/Impact-Visuals | MVP |
| Priest Heal | Heilung ueber negative Damage, kein Self-Heal | gleiche Regel | MVP |
| Strategies | Attack, Guard, March, Berserk | gleiche Effekte und 5s Cooldown | MVP |
| Boost Draft | alle 30s Auswahl aus 3 Boosts | gleiche Frequenz, Auswahl und Slotlimit | MVP |
| Boost Slots | max 4 selected/active | gleiche Begrenzung, Gegner sieht nur aktive Boosts | MVP |
| Boosts | 48 Boosts mit Dauer/Bedingung/Effekt | alle erfassen, gruppiert implementieren, keine Balance-Aenderungen | MVP nach Core |
| UI In-Game | Lane links oben, Boosts oben, Strategie im Banner | Struktur matchen, Mobile Controls als additive Huelle | Spec |
| Menu | Escape Ingame Menu | Mobile Menu-Button ergaenzen, gleiche Zustandslogik | Spec |
| Audio | Musik + 9 SFX | gleiche Events und Settings | MVP |
| Settings | Audio/Volume, evtl. Persistenz | LocalStorage fuer Browser, Verhalten dokumentieren | Spec |
| Game Speed | 0.25 bis 16, Host-only | Solo/Dev behalten; Host-only-Regel entfaellt ohne Multiplayer | Spec |
| Pause | Space | Touch-Button plus Desktop-Key | MVP |
| Unit Info | H toggelt Panel | Mobile Panel/Drawer ohne Featureverlust | Spec |
| Asset Identity | Original PNG/OGG/TTF | Assets uebernehmen, Pfade manifestieren, Lizenzhinweis erhalten | MVP |

## Nicht erlaubte Abkuerzungen

- Keine geaenderten Stats fuer "besseres Mobile-Balancing".
- Keine reduzierte Boost-Liste als stiller MVP.
- Keine neue Map, solange TMX/Layer gelesen werden koennen.
- Keine UI-Redesigns, die Originalpositionen und Informationshierarchie aufloesen.
- Kein einzelnes `Game.ts`/`main.js` mit allen Systemen.
