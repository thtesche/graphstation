"""
Python-Tests für GraphStation Backend.

Übersicht
=========
Tests laufen gegen eine echte Memgraph-Datenbank über den Neo4j-Treiber (Bolt-Protokoll).
Endpunkte, die NAS- externe Dienste aufrufen, werden gezielt gemockt.

Dateien
-------
- ``conftest.py``   – Pytest-Fixtures (Driver, Datenbank-Bereinigung, Test-Client)
- ``test_main.py``  – Alle Backend-Tests, gruppiert nach Endpunkten

Ausführung lokal (Docker)
-------------------------
Memgraph + API starten:

.. code-block:: bash

    docker compose -f docker-compose.yml up -d memgraph-db api

Tests im API-Container ausführen:

.. code-block:: bash

    docker cp backend/tests/test_main.py graphstation-api:/app/tests/test_main.py
    docker compose -f docker-compose.yml exec api python -m pytest tests/test_main.py -v

GitHub Actions (CI)
-------------------
Jeder Push / PR auf ``main``:

1. ``ubuntu-latest`` mit Memgraph als Service-Container (kein Auth).
2. Python 3.11, ``pip install`` aus ``backend/requirements.txt``.
3. Pytest mit ``MEMGRAPH_HOST=localhost``, ``MEMGRAPH_USER=''``, ``MEMGRAPH_PASSWORD=''``.

Struktur der Tests
------------------

Sektion                              | Fokus                    | Auth | DB | NAS
-------------------------------------|--------------------------|------|----|----
Session / Cache                      | Reines Python            | –    | –  | –
Health                               | Status-Anzeige           | –    | –  | –
Login                                | NAS-Auth (synologic)     | –    | –  | ✅
Checkauth                            | Session-Validierung      | –    | –  | ✅
Filters                              | Filter-Query             | ✅   | ✅ | –
Photos                               | Foto-Liste               | ✅   | ✅ | –
Photo Details                        | Foto-Details             | ✅   | ✅ | –
Photos Grouped                       | Gruppierte Foto-Liste    | ✅   | ✅ | –
Graph                                | Vollständiges Query      | ✅   | ✅ | –

* ✅ = benötigt / gemockt
* ✅ = echte Memgraph-Query


Tests lokal ausführen
---------------------

1. Memgraph und API starten:

.. code-block:: bash

    docker compose -f docker-compose.yml up -d memgraph-db api

2. Testdatei in den Container kopieren:

.. code-block:: bash

    docker cp backend/tests/test_main.py graphstation-api:/app/tests/test_main.py

3. Pytest im Container starten:

.. code-block:: bash

    docker compose -f docker-compose.yml exec api python -m pytest tests/test_main.py -v

Alle Tests sollten mit ``PASSED`` abschließen (aktuell 31 Tests).

Wichtige Hinweise
-----------------

- Der ``neo4j``-Python-Treiber funktioniert mit Memgraph über das Bolt-Protokoll.
- ``conftest.py`` liest Umgebungsvariablen aus ``MEMGRAPH_HOST``, ``MEMGRAPH_PORT``,
  ``MEMGRAPH_USER``, ``MEMGRAPH_PASSWORD`` (definiert in ``.env``).
- Der ``db_clean``-Fixture löscht vor jedem Test alle Knoten und Kanten
  (``MATCH (n) DETACH DELETE n``), sodass jeder Test einen sauberen Zustand hat.
- Das ``authed_client``-Fixture patcht ``get_user_from_sid`` so, dass es
  ``testuser`` zurückgibt und so Auth-Checks überspringt – ohne echten Cookie
  senden zu müssen.
- NAS-Aufrufe werden über ``@patch('urllib.request.urlopen')`` gemockt, da
  kein NAS im Test-System verfügbar ist.
"""