# Synology Deployment & Web Station Setup

Diese Anleitung beschreibt die Konfiguration der Synology NAS für GraphStation und die Nutzung der automatisierten Deployment-Skripte.

## 1. Web Station Konfiguration

Um GraphStation zu hosten, müssen Webdienste und Portale in der Synology Web Station konfiguriert werden.

### Frontend (Statische Website)
1. Öffnen Sie die **Web Station** auf Ihrem DSM.
2. Gehen Sie zu **Webdienst** und klicken Sie auf **Erstellen**.
3. Wählen Sie **Statische Website**.
4. **Name:** `graphstation-frontend`
5. **Dokument-Root:** Wählen Sie den Zielordner (z. B. `/web/graphstation_frontend`).
6. Klicken Sie auf **Weiter** und **Erstellen**.

### Backend (Python Service)
Die API basiert auf einem Python-Skript-Sprache-Dienst:

1. Öffnen Sie **Web Station** > **Skript-Sprachen-Einstellungen**.
2. Klicken Sie auf **Erstellen** und wählen Sie **Python 3.9**.
3. **Name:** `graphstation-backend`
4. Klicken Sie auf **Weiter** und **Erstellen**.

### Web Portale (Zugriffspfade)
Sie müssen Portale erstellen, damit die Dienste über das Netzwerk erreichbar sind:

1. **Frontend Portal:**
   - Dienst: `graphstation-frontend`
   - Typ: **Alias**
   - Alias: `graphstation` (Zugriff über `http://nas-ip/graphstation`)
2. **Backend Portal:**
   - Dienst: `graphstation-backend`
   - Typ: **Alias**
   - Alias: `graphstation/api`
   - **WICHTIG:** Stellen Sie sicher, dass der **Dokument-Root** auf den `/api` Unterordner zeigt, in den das Backend deploit wird.

## 2. Lokale Umgebungskonfiguration

Stellen Sie sicher, dass Ihre lokale `.env`-Datei korrekt konfiguriert ist:

```bash
# Synology Connection
NAS_HOST=192.168.0.x
NAS_USER=ihr_benutzer
NAS_WEB_PATH=/volume1/web/graphstation_frontend

# Memgraph Konfiguration (wird vom Backend genutzt)
MEMGRAPH_HOST=192.168.0.x
MEMGRAPH_PORT=7687
```

## 3. Deployment

### Frontend deploien
Führen Sie das Skript im Hauptverzeichnis aus:
```bash
./deploy.sh
```
Dies baut das React-Projekt und lädt die statischen Dateien hoch.

### Backend deploien
Führen Sie das Backend-Deployment aus:
```bash
./deploy_backend.sh
```
Dies lädt die Python-Dateien in den `/api` Unterordner Ihres NAS-Webpfads.

## 4. Installation der Backend-Abhängigkeiten

Nach dem ersten Deployment müssen die Python-Module auf der NAS installiert werden:

1. Verbinden Sie sich per SSH mit Ihrer NAS.
2. Navigieren Sie zum API-Ordner:
   ```bash
   cd /volume1/web/graphstation_frontend/api
   ```
3. Installieren Sie die Requirements:
   ```bash
   python3 -m pip install -r requirements.txt
   ```

*Hinweis: Wenn Sie SSH-Zugriff haben, stellen Sie sicher, dass der Benutzer Schreibrechte im Web-Ordner hat.*

Nach erfolgreicher Konfiguration ist die App erreichbar unter:
`http://ihre-nas-ip/graphstation/`
