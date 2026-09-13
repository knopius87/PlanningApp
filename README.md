# Planpult 1.2

Planpult ist ein lokales Schuljahr- und Belastungs-Cockpit für das Schuljahr 2026/27. Die statische Web-App läuft ohne Serverlogik, speichert Aufgaben ausschließlich im Browser und kann als Progressive Web App auf dem Startbildschirm installiert werden.

## Funktionen

- Wochenansicht mit festem Stundenplan und geschütztem Mittwoch als Haupt-Arbeitstag
- Belastungsampel für Woche und einzelne Tage mit frei einstellbarem Puffer
- Aufgaben für Korrektur, Vorbereitung, Nachbereitung, Elternkommunikation, Klassenleitung, Fach-/Projektarbeit und Schulorganisation
- automatische Verteilung großer Aufgaben in Arbeitsblöcke bis zur Frist – auch über mehrere Wochen
- Jahresplan 2026/27 mit Suche und Vorbereitungsvorschlägen
- differenzierter Korrektur-Rechner für Deutsch, Spanisch und Musik
- transparente Kennzeichnung von empirisch gestützten Ausgangswerten, Proxywerten und reinen Planwerten
- persönliche Korrekturwerte aus eingegebener Ist-Zeit; diese werden künftig bevorzugt vorgeschlagen
- lokales Backup und Restore als JSON
- Dark Mode, Smartphone-Layout und Offline-Betrieb nach dem ersten Laden

## Korrekturwerte

Die Deutsch-Werte orientieren sich an einer kleinen NRW-Selbstauskunft zu Korrekturzeiten und sind in der App entsprechend vorsichtig gekennzeichnet. Für Spanisch werden Werte anderer moderner Fremdsprachen als Proxy verwendet. Vokabeltests und Musiktests sind ausdrücklich als Planwerte gekennzeichnet. Persönliche Ist-Zeiten überschreiben keinen Forschungswert, sondern bilden einen getrennten, bevorzugten persönlichen Durchschnitt.

## Veröffentlichung mit GitHub Pages

Alle Dateien gehören direkt in das Root-Verzeichnis des Branches `main`:

1. In GitHub **Settings → Pages** öffnen.
2. Unter **Build and deployment** die Quelle **Deploy from a branch** wählen.
3. Branch **main** und Ordner **/(root)** auswählen und speichern.
4. Nach dem ersten Deployment ist die App unter `https://knopius87.github.io/Planpult/` erreichbar.

Die Pfade in HTML, Manifest und Service Worker sind relativ (`./`). Deshalb funktioniert die PWA auch unter dem GitHub-Pages-Unterpfad `/Planpult/`.

## Datenschutz

Aufgaben, Regeln und persönliche Korrekturwerte werden in `localStorage` des verwendeten Browsers gespeichert. Es werden keine persönlichen Daten an einen Server übertragen. Ein Browserwechsel oder das Löschen der Websitedaten entfernt lokale Einträge; dafür gibt es die Backup-Funktion unter **Regeln**.

## Dateien

- `index.html` – Startdatei
- `styles.css` – Oberfläche und Smartphone-Layout
- `app.js` – Planung, Belastungslogik, Korrektur-Rechner und Speicherung
- `events.js` / `events.json` – schulischer Terminplan 2026/27
- `manifest.webmanifest` – Installationsmetadaten
- `service-worker.js` – Offline-Cache `planpult-v1.2.0`
- `icon-192.png` / `icon-512.png` – Homescreen-Icons
