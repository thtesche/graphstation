# Deployment Option A: Synology NAS (Web Station)

Diese Anleitung beschreibt die Konfiguration der Synology NAS für GraphStation und die Nutzung der automatisierten Deployment-Skripte für den Fall, dass **alle Komponenten direkt auf der NAS** gehostet werden.

## 1. Lokales Setup (Entwicklungsrechner)

Bevor Sie mit dem Deployment auf die NAS beginnen, richten Sie Ihre lokale Umgebung ein:

1. Stellen Sie sicher, dass **Node.js** und **npm** auf Ihrem Rechner installiert sind.
2. Führen Sie im Hauptverzeichnis des Projekts das Setup-Skript aus:
   ```bash
   ./setup_local.sh
   ```
3. Das Skript installiert die Frontend-Abhängigkeiten und fragt Sie nach Ihren NAS-Zugangsdaten, um automatisch eine `.env`-Datei für das spätere Deployment zu erstellen.

## 2. Web Station Konfiguration (auf der NAS)

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

### Webdienst erstellen (für das Backend)
Nachdem das Skript-Sprachen-Profil erstellt wurde, legen Sie den eigentlichen Webdienst an:

1. Gehen Sie zu **Webdienst** > **Erstellen** > **Skript-Sprachen-Dienst** > **Python**.
2. **Name:** `graphstation-backend-service`
3. **Dokument-Root:** Wählen Sie den API-Ordner (z. B. `/web/graphstation_frontend/api`).
4. **WSGI-Datei:** Wählen Sie die Datei `wsgi.py` im API-Ordner aus.
5. **Aufrufbar:** Geben Sie `application` ein (dies entspricht dem Namen in der `wsgi.py`).
6. Klicken Sie auf **Weiter** und **Erstellen**.

### Web Portale (Zugriffspfade)
Sie müssen Portale erstellen, damit die Dienste über das Netzwerk erreichbar sind:

1. **Frontend Portal:**
   - Dienst: `graphstation-frontend`
   - Typ: **Alias**
   - Alias: `graphstation` (Zugriff über `http://nas-ip/graphstation`)
2. **Backend Portal:**
   - Dienst: `graphstation-backend`
   - Typ: **Alias**
   - Alias: `graphstation-api`
   - **Hinweis:** Synology erlaubt keine Schrägstriche im Aliasnamen.

## 3. Lokale Umgebungskonfiguration (Manuell)

Falls das Skript `./setup_local.sh` nicht verwendet wurde, stellen Sie sicher, dass Ihre lokale `.env`-Datei korrekt manuell konfiguriert ist:

```bash
# Synology Connection
GRAPHSTATION_HOST=192.168.0.x
GRAPHSTATION_USER=ihr_benutzer
GRAPHSTATION_WEB_PATH=/volume1/web/graphstation_frontend

# Memgraph Konfiguration (wird vom Backend genutzt)
MEMGRAPH_HOST=192.168.0.x
MEMGRAPH_PORT=7687
```

## 4. Deployment

Das Projekt nutzt ein zentrales Deployment-Skript, um Frontend und Backend auf die NAS zu übertragen.

### Alles deploien (Standard)
```bash
./deploy.sh
```

### Nur Frontend deploien
```bash
./deploy.sh frontend
```

### Nur Backend deploien
```bash
./deploy.sh backend
```

## 5. Installation der Backend-Abhängigkeiten

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

## 6. Authentifizierung & Benutzererkennung

GraphStation versucht automatisch den aktuell angemeldeten DSM-Benutzer zu erkennen (via `id`-Cookie). Falls keine Anmeldung gefunden wird, wird der `DEFAULT_OWNER` aus der `.env` genutzt.

---

## 7. Sicherheitshinweise

### Zugriffsbeschränkung per IP-Adresse
Da GraphStation auf die Erkennung von DSM-Sitzungscookies vertraut, wird dringend empfohlen, den Zugriff in der **Web Station** zusätzlich per **IP-Adress-Beschränkung** (Access Control List) abzusichern. Dies stellt sicher, dass nur vertrauenswürdige Geräte aus dem lokalen Netzwerk auf die Anwendung zugreifen können.

---

Nach erfolgreicher Konfiguration ist die App erreichbar unter:
`http://ihre-nas-ip/graphstation/`
