# SSL Zertifikats-Setup mit mkcert

Diese Dokumentation beschreibt, wie lokale SSL-Zertifikate für die Entwicklung und das Deployment auf dem NAS (unter Verwendung von `mkcert`) erstellt und konfiguriert werden.

## Voraussetzungen
- [mkcert](https://github.com/FiloSottile/mkcert) ist auf dem Host-System installiert.
- Die lokale CA wurde einmalig mit `mkcert -install` registriert.

## Schritt 1: Zertifikat generieren

Navigiere in das Verzeichnis, in dem du die Zertifikate verwalten möchst. Erstelle das Zertifikat für deinen Hostnamen (ersetze `your-domain` durch deinen tatsächlichen Hostnamen, z. B. `atlantis`).

```bash
# 1. Zertifikat und Private Key für den Hostnamen generieren
mkcert your-domain
```

Dies erzeugt zwei Dateien im aktuellen Verzeichnis:
- `your-domain.pem` (Das öffentliche Zertifikat)
- `your-domain-key.pem` (Der private Schlüssel)

## Schritt 2: Dateien für Nginx vorbereiten

Die Nginx-Konfiguration im Docker-Container erwartet die Zertifikate in einem spezifischen Verzeichnis. Laut der `docker-compose.yml` ist das Zielverzeichnis auf dem Host: `./frontend/certs`.

Wir müssen die Dateien umbenennen (falls in der `nginx.conf` andere Namen definiert sind) und in das Zielverzeichnis verschieben.

```bash
# 1. Zielverzeichnis auf dem Host erstellen (falls nicht vorhanden)
mkdir -p frontend/certs

# 2. Dateien umbenennen und in das Zielverzeichnis kopieren
# Falls deine nginx.conf z.B. 'your-domain.pem' erwartet:
cp your-domain.pem frontend/certs/your-domain.pem
cp your-domain-key.pem frontend/certs/your-domain-key.pem

# 3. Sicherstellen, dass die Berechtigungen korrekt sind
chmod 644 frontend/certs/your-domain.pem
chmod 600 frontend/certs/your-domain-key.pem
```

## Schritt 3: Docker-Container neu starten

Damit Nginx die neuen Dateien im gemappten Volume erkennt, muss der Container neu erstellt werden.

```bash
# Den Nginx-Container stoppen, die Konfiguration neu laden und starten
docker-compose up -d --force-recreate nginx
```

## Fehlerbehebung

| Symptom | Ursache | Lösung |
| :--- | :--- | :--- |
| `BIO_new_file() failed` (Nginx Log) | Datei nicht gefunden oder falscher Pfad. | Prüfe das Mapping in `docker-compose.yml` und den Dateinamen in der `nginx.conf`. |
| `Permission denied` (Nginx Log) | Datei gehört `root` oder hat zu restriktive Rechte. | `sudo chown -R $USER:$USER frontend/certs` ausführen. |
| Browser zeigt "Unsichere Verbindung" | CA nicht im Browser installiert. | Führe `mkcert -install` auf dem Client-Rechner aus. |
