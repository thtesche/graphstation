# Deployment Option B: Externer Rechner (Docker)

Diese Anleitung beschreibt die Bereitstellung von GraphStation-Komponenten (aktuell Memgraph und Memgraph Lab) auf einem externen Zielrechner mittels Docker Compose. Zukünftig werden hier auch Backend und Frontend integriert.

## Voraussetzungen

- Ein Zielrechner (z. B. Linux-Server, Mini-PC, Raspberry Pi oder Cloud-VM).
- **Docker** und **Docker Compose** müssen auf dem Zielrechner installiert sein.
- Zugriff auf den Zielrechner (z. B. per SSH).

## 1. Projektdateien auf den Zielrechner übertragen

Sie müssen die Docker-Konfiguration auf den Zielrechner kopieren. Minimal erforderlich sind folgende Dateien aus dem Projektverzeichnis:
- `docker-compose.yml`
- `users.txt`

Wenn Sie SSH-Zugriff haben, können Sie die Dateien z. B. mit `scp` (Secure Copy) von Ihrem Entwicklungsrechner übertragen:

```bash
# Beispiel: Kopiert die Dateien in das Home-Verzeichnis des Benutzers auf dem Zielrechner
scp docker-compose.yml users.txt ihr_benutzer@zielrechner-ip:~/graphstation/
```

## 2. Datenbank-Zugangsdaten anpassen (users.txt)

Die Datei `users.txt` enthält die Anmeldedaten für die Memgraph-Datenbank im Format `benutzername:passwort`. 
Standardmäßig haben wir lokal `admin:admin` angelegt.

Öffnen Sie die Datei auf dem Zielrechner und ändern Sie das Passwort aus Sicherheitsgründen:
```bash
cd ~/graphstation/
nano users.txt
```

## 3. Docker Container starten

Navigieren Sie in den Ordner, der die `docker-compose.yml` enthält, und starten Sie die Container im Hintergrund (`-d`):

```bash
cd ~/graphstation/
docker-compose up -d
```
*(Hinweis: Auf neueren Systemen lautet der Befehl `docker compose up -d` ohne Bindestrich).*

Docker Compose wird nun:
1. Die benötigten Images (Memgraph & Memgraph Lab) herunterladen.
2. Automatisch die lokalen Ordner `data/` (für die persistente Datenbank) und `log/` im aktuellen Verzeichnis erstellen.
3. Die Container starten.

## 4. Status überprüfen und Zugriff

Überprüfen Sie, ob die Container fehlerfrei laufen:
```bash
docker-compose ps
```

Sie können nun über Ihren Webbrowser auf **Memgraph Lab** zugreifen, um die Datenbank visuell zu verwalten:
- **URL:** `http://<zielrechner-ip>:3000`
- Loggen Sie sich mit den Zugangsdaten aus Ihrer `users.txt` ein.

Die Datenbank selbst (Bolt-Protokoll) ist für das GraphStation-Backend oder Sync-Skripte über den Port **7687** der Zielrechner-IP erreichbar.

## 5. Updates und Verwaltung

**Container stoppen:**
```bash
docker-compose down
```
*(Ihre Daten bleiben im `data/`-Ordner sicher erhalten).*

**Images aktualisieren:**
Wenn Sie auf die neusten Versionen updaten möchten:
```bash
docker-compose pull
docker-compose up -d
```
