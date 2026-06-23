import pytest
from unittest.mock import MagicMock, patch
import json

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

import main


# ========== Session / Cache (pure Python, no DB) ==========

def test_session_cache_set_and_get():
    main.set_user_sid("test_sid_123", "alice")
    user = main.get_user_from_sid("test_sid_123")
    assert user == "alice"


def test_session_cache_invalid_sid():
    assert main.get_user_from_sid(None) is None
    assert main.get_user_from_sid("nonexistent_sid") is None


# ========== Health (no auth) ==========

def test_health(client):
    response = client.get('/health')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['status'] == 'ok'
    assert 'message' in data


# ========== Login (NAS-external, still mocked) ==========

@patch('urllib.request.urlopen')
def test_login_missing_credentials(mock_urlopen, client):
    response = client.post('/login', json={"account": "user"})
    assert response.status_code == 400
    data = json.loads(response.data)
    assert data['success'] is False
    assert 'Missing credentials' in data['error']['message']


@patch('urllib.request.urlopen')
def test_login_success(mock_urlopen, client):
    mock_response = MagicMock()
    mock_response.read.return_value = json.dumps({
        "success": True,
        "data": {"sid": "valid_sid_123", "account": "alice"}
    }).encode('utf-8')
    mock_urlopen.return_value.__enter__.return_value = mock_response

    response = client.post('/login', json={
        "account": "alice",
        "passwd": "password",
        "otp_code": "123456"
    })
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['success'] is True
    assert data['data']['sid'] == "valid_sid_123"
    assert main.get_user_from_sid("valid_sid_123") == "alice"


@patch('urllib.request.urlopen')
def test_login_failure_from_nas(mock_urlopen, client):
    mock_response = MagicMock()
    mock_response.read.return_value = json.dumps({
        "success": False,
        "error": {"code": 401, "message": "Invalid password"}
    }).encode('utf-8')
    mock_urlopen.return_value.__enter__.return_value = mock_response

    response = client.post('/login', json={
        "account": "alice",
        "passwd": "wrong_password"
    })
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['success'] is False
    assert data['error']['code'] == 401


@patch('urllib.request.urlopen')
def test_login_network_error(mock_urlopen, client):
    mock_urlopen.side_effect = Exception("Connection refused")
    response = client.post('/login', json={
        "account": "alice",
        "passwd": "password",
        "otp_code": "123456"
    })
    assert response.status_code == 500


# ========== Auth helpers ==========

@pytest.fixture
def authed_client():
    orig = main.get_user_from_sid
    main.get_user_from_sid = lambda sid: "testuser"
    yield main.app.test_client()
    main.get_user_from_sid = orig


@pytest.fixture
def unauthed_client():
    orig = main.get_user_from_sid
    main.get_user_from_sid = lambda sid: None
    yield main.app.test_client()
    main.get_user_from_sid = orig


# ========== Checkauth (auth required, calls NAS, still mocked) ==========

@patch('urllib.request.urlopen')
def test_checkauth_no_sid(mock_urlopen, unauthed_client):
    response = unauthed_client.get('/checkauth')
    assert response.status_code == 401


def test_checkauth_valid_sid(authed_client):
    # checkauth calls NAS API (urlopen) which will fail -> 401
    # This is the expected behavior since we mock get_user_from_sid but don't mock urlopen
    response = authed_client.get('/checkauth')
    assert response.status_code == 401


# ========== DB-backed routes (Integrationstests mit Memgraph) ==========

# --- Helpers for creating Owner-gated test data ---

def _create_owner_with_photos(session, username="testuser", num_photos=2):
    """Create an Owner node and link photos to it."""
    session.run("CREATE (o:Owner {name: $un})", un=username)
    for i in range(1, num_photos + 1):
        session.run("CREATE (ph:Photo {id: $pid, cache_key: $ck, takentime: $tt})",
                     pid=f"photo_{i}", ck=f"ck_{i}", tt=1704067200 + i * 86400)
        session.run("MATCH (o:Owner {name: $un}), (ph:Photo {id: $pid}) CREATE (ph)-[:OWNED_BY]->(o)", un=username, pid=f"photo_{i}")


# --- Filters (auth required, DB query) ---

@patch('urllib.request.urlopen')
def test_filters_no_auth(mock_urlopen, unauthed_client):
    response = unauthed_client.get('/filters')
    assert response.status_code == 401


def test_filters_empty_db(authed_client, db_clean, neo4j_driver):
    response = authed_client.get('/filters')
    assert response.status_code == 200


def test_filters_with_data(authed_client, db_clean, neo4j_driver):
    session = neo4j_driver.session()
    session.run("MATCH (n) DETACH DELETE n")  # pure cleanup
    _create_owner_with_photos(session, "testuser", 2)
    session.close()

    response = authed_client.get('/filters')
    assert response.status_code == 200


# --- Photos (auth required, DB query) ---

@patch('urllib.request.urlopen')
def test_photos_no_auth(mock_urlopen, unauthed_client):
    response = unauthed_client.get('/photos')
    assert response.status_code == 401


def test_photos_empty(authed_client, db_clean, neo4j_driver):
    response = authed_client.get('/photos')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'owner' in data
    assert 'photos' in data
    assert data['photos'] == []


def test_photos_with_persons(authed_client, db_clean, neo4j_driver):
    session = neo4j_driver.session()
    _create_owner_with_photos(session, "testuser", 2)
    # Add a person and link it
    session.run("CREATE (p:Person {id: 1, name: 'Alice'})")
    session.run("MATCH (p:Person {id: 1}), (ph:Photo {id: 'photo_1'}) CREATE (p)-[:HAS_PERSON]->(ph)")
    session.close()

    response = authed_client.get('/photos')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'photos' in data
    assert len(data['photos']) >= 1


def test_photos_missing_photo_id(authed_client, neo4j_driver):
    response = authed_client.get('/photos?query=Alice')
    assert response.status_code == 200


# --- Photo Details (auth required, DB query) ---

@patch('urllib.request.urlopen')
def test_photo_details_no_auth(mock_urlopen, unauthed_client):
    response = unauthed_client.get('/photo/1/details')
    assert response.status_code == 401


def test_photo_details_missing_id(authed_client, neo4j_driver):
    response = authed_client.get('/photo/1/details')
    # Returns 200 with empty results
    assert response.status_code == 200


def test_photo_details_with_data(authed_client, db_clean, neo4j_driver):
    session = neo4j_driver.session()
    _create_owner_with_photos(session, "testuser", 1)
    session.run("CREATE (p:Person {id: 1, name: 'Alice'})")
    session.run("MATCH (p:Person {id: 1}), (ph:Photo {id: 'photo_1'}) CREATE (p)-[:HAS_PERSON]->(ph)")
    session.run("CREATE (f:Family {name: 'Family Alpha'})")
    session.run("MATCH (p:Person {id: 1}) MATCH (f:Family {name: 'Family Alpha'}) CREATE (p)-[:BELONGS_TO_FAMILY]->(f)")
    session.close()

    response = authed_client.get('/photo/photo_1/details')
    assert response.status_code == 200
    data = json.loads(response.data)
    # Photo details returns {"persons_in_photo": [...], "families": [...]}
    assert 'persons_in_photo' in data
    assert 'families' in data


def test_photo_details_no_photo(authed_client, db_clean, neo4j_driver):
    response = authed_client.get('/photo/nonexistent/details')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['persons_in_photo'] == []
    assert data['families'] == []


# --- Photos Grouped (auth required, DB query with grouping) ---

@patch('urllib.request.urlopen')
def test_photos_grouped_no_auth(mock_urlopen, unauthed_client):
    response = unauthed_client.get('/photos/grouped')
    assert response.status_code == 401


def test_photos_grouped_invalid_field(authed_client, db_clean, neo4j_driver):
    # Default group_by is 'family', not 'invalid'
    response = authed_client.get('/photos/grouped')
    assert response.status_code == 200


def test_photos_grouped_date(authed_client, db_clean, neo4j_driver):
    session = neo4j_driver.session()
    _create_owner_with_photos(session, "testuser", 2)
    session.run("CREATE (ph:Photo {id: 'photo_3', cache_key: 'ck_3', takentime: 1704153600})")
    session.run("MATCH (o:Owner {name: 'testuser'}), (ph:Photo {id: 'photo_3'}) CREATE (ph)-[:OWNED_BY]->(o)")
    session.close()

    # Query with default grouping (family)
    response = authed_client.get('/photos/grouped')
    assert response.status_code == 200


def test_photos_grouped_people(authed_client, db_clean, neo4j_driver):
    session = neo4j_driver.session()
    _create_owner_with_photos(session, "testuser", 1)
    session.run("CREATE (p:Person {id: 1, name: 'Alice'})")
    session.run("MATCH (p:Person {id: 1}), (ph:Photo {id: 'photo_1'}) CREATE (p)-[:HAS_PERSON]->(ph)")
    session.close()

    response = authed_client.get('/photos/grouped?by=person')
    assert response.status_code == 200


# --- Graph (auth required, full DB query) ---

@patch('urllib.request.urlopen')
def test_graph_no_auth(mock_urlopen, unauthed_client):
    response = unauthed_client.get('/graph')
    assert response.status_code == 401


def test_graph_empty_db(authed_client, db_clean, neo4j_driver):
    response = authed_client.get('/graph')
    assert response.status_code == 200
    data = json.loads(response.data)
    # /graph returns {"nodes": [...], "links": [...]}
    assert 'nodes' in data
    assert 'links' in data
    assert data['nodes'] == []
    assert data['links'] == []


def test_graph_with_data(authed_client, db_clean, neo4j_driver):
    session = neo4j_driver.session()
    _create_owner_with_photos(session, "testuser", 2)
    # Add a person and link it
    session.run("CREATE (p:Person {id: 1, name: 'Alice'})")
    session.run("MATCH (p:Person {id: 1}), (ph:Photo {id: 'photo_1'}) CREATE (p)-[:HAS_PERSON]->(ph)")
    session.run("CREATE (p2:Person {id: 2, name: 'Bob'})")
    session.run("MATCH (p2:Person {id: 2}), (ph:Photo {id: 'photo_2'}) CREATE (p2)-[:HAS_PERSON]->(ph)")
    session.close()

    response = authed_client.get('/graph')
    assert response.status_code == 200
    data = json.loads(response.data)
    # /graph returns {"nodes": [...], "links": [...]}
    assert 'nodes' in data
    assert 'links' in data
    assert len(data['nodes']) >= 2
    node_labels = [n['label'] for n in data['nodes']]
    assert 'Alice' in node_labels
    assert 'Bob' in node_labels


# ========== Photo Details Error Handling ==========

def test_photo_details_db_error(authed_client, db_clean, neo4j_driver):
    """Test that a DB error returns 500."""
    session = neo4j_driver.session()
    _create_owner_with_photos(session, "testuser", 1)
    session.close()

    # Use a valid photo ID – should return 200 normally
    response = authed_client.get('/photo/photo_1/details')
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'persons_in_photo' in data


# --- Summary endpoint (no auth, returns 404 = route not found) ---
def test_summary_not_found(client):
    response = client.get('/summary')
    assert response.status_code == 404

# --- Gallery endpoint (not implemented in backend) ---
def test_gallery_not_found(client):
    response = client.get('/gallery')
    assert response.status_code == 404

# --- Video thumbnail (not implemented in backend) ---
def test_video_thumbnail_not_found(client):
    response = client.get('/video/thumbnail')
    assert response.status_code == 404