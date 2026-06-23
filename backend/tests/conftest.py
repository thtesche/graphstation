import pytest
import os
import sys
from pathlib import Path
from neo4j import GraphDatabase

# Main hinzufügen, damit import main funktioniert
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import main


@pytest.fixture(scope="session", autouse=True)
def setup_test_env():
    """
    Stelle sicher, dass Umgebungsvariablen für den Memgraph-Container gesetzt sind.
    Standardmäßig zeigt auf 'memgraph-db' im Docker-Compose, 'localhost' für lokale/CI-Läufe.
    """
    os.environ.setdefault("MEMGRAPH_HOST", "memgraph-db")
    os.environ.setdefault("MEMGRAPH_PORT", "7687")
    os.environ.setdefault("MEMGRAPH_USER", "admin")
    os.environ.setdefault("MEMGRAPH_PASSWORD", "EeGFS2z1Nh1")


@pytest.fixture(scope="session")
def neo4j_driver():
    """
    Liefert einen echten Graphen-Datenbanktreiber (funktioniert mit Neo4j und Memgraph)
    für die Test-Sitzung.  Fallback: keine Auth, wenn User/Password leer sind.
    """
    host = os.getenv("MEMGRAPH_HOST", "localhost")
    port = os.getenv("MEMGRAPH_PORT", "7687")
    user = os.getenv("MEMGRAPH_USER", "admin")
    password = os.getenv("MEMGRAPH_PASSWORD", "EeGFS2z1Nh1")
    uri = f"bolt://{host}:{port}"

    # Wenn keine Anmeldedaten gesetzt sind (CI-Fall mit --no-auth), keine Auth senden
    if user and password:
        driver = GraphDatabase.driver(uri, auth=(user, password))
    else:
        driver = GraphDatabase.driver(uri)

    yield driver
    driver.close()


@pytest.fixture(scope="function")
def db_clean(neo4j_driver):
    """
    Bereinigt die Datenbank vor jedem Test, damit ein definierter Zustand gegeben ist.
    """
    with neo4j_driver.session() as session:
        session.run("MATCH (n) DETACH DELETE n")
    yield


@pytest.fixture
def client():
    """
    Flask-Test-Client.
    """
    main.app.testing = True
    with main.app.test_client() as client:
        yield client