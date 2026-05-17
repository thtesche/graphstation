import os
import logging
from flask import Flask, jsonify, request
from flask_cors import CORS
from neo4j import GraphDatabase
from dotenv import load_dotenv

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load .env
# Search for .env in current dir, backend/ dir, or root dir
env_paths = [
    os.path.join(os.path.dirname(__file__), '.env'),
    os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env'),
    '.env'
]

for path in env_paths:
    if os.path.exists(path):
        load_dotenv(path)
        logger.info(f"Loaded .env from {path}")
        break
else:
    load_dotenv()
    logger.info("Loaded .env from environment or default location")

app = Flask(__name__)
# CORS configuration
CORS(app, supports_credentials=True)

# Configuration
MEMGRAPH_HOST = os.getenv('MEMGRAPH_HOST', 'localhost')
MEMGRAPH_PORT = os.getenv('MEMGRAPH_PORT', '7687')
MEMGRAPH_USER = os.getenv('MEMGRAPH_USER', '')
MEMGRAPH_PASSWORD = os.getenv('MEMGRAPH_PASSWORD', '')
DEFAULT_OWNER = os.getenv('DEFAULT_OWNER', 'thtesche')

# Neo4j Driver
driver = None
try:
    # Explicitly check if we have the necessary config
    logger.info(f"Connecting to Memgraph at {MEMGRAPH_HOST}:{MEMGRAPH_PORT} (User: {MEMGRAPH_USER})")
    driver = GraphDatabase.driver(
        f"bolt://{MEMGRAPH_HOST}:{MEMGRAPH_PORT}",
        auth=(MEMGRAPH_USER, MEMGRAPH_PASSWORD) if MEMGRAPH_USER else None
    )
    # Try a quick connectivity test
    driver.verify_connectivity()
    logger.info("Successfully connected to Memgraph")
except Exception as e:
    logger.error(f"Failed to create or verify driver: {e}")


import urllib.request
import urllib.parse
import json
import time

CACHE_FILE = os.path.join(os.path.dirname(__file__), 'session_cache.json')

def load_cache():
    if os.path.exists(CACHE_FILE):
        try:
            with open(CACHE_FILE, 'r') as f:
                return json.load(f)
        except:
            pass
    return {}

def save_cache(cache):
    try:
        with open(CACHE_FILE, 'w') as f:
            json.dump(cache, f)
    except Exception as e:
        logger.error(f"Failed to save cache: {e}")

def get_user_from_sid(sid):
    if not sid:
        return None
    cache = load_cache()
    if sid in cache:
        session = cache[sid]
        if session.get('expires', 0) > time.time():
            return session.get('account')
        else:
            del cache[sid]
            save_cache(cache)
    return None

def set_user_sid(sid, account):
    cache = load_cache()
    cache[sid] = {
        'account': account,
        'expires': time.time() + 14 * 24 * 60 * 60 # 14 days
    }
    save_cache(cache)

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "ok", "message": "GraphStation Backend is running"})

@app.route('/login', methods=['POST'])
def login():
    data = request.json
    if not data or 'account' not in data or 'passwd' not in data:
        return jsonify({"success": False, "error": {"code": 400, "message": "Missing credentials"}}), 400
    
    payload = {
        'api': 'SYNO.API.Auth',
        'version': '7',
        'method': 'login',
        'account': data['account'],
        'passwd': data['passwd'],
        'format': 'sid'
    }
    if 'otp_code' in data and data['otp_code']:
        payload['otp_code'] = data['otp_code']
        
    encoded_data = urllib.parse.urlencode(payload).encode('utf-8')
    url = 'http://localhost:5000/webapi/auth.cgi'
    
    try:
        req = urllib.request.Request(url, data=encoded_data, method='POST')
        with urllib.request.urlopen(req, timeout=10) as response:
            res_body = response.read()
            res_json = json.loads(res_body)
            if res_json.get('success') and 'data' in res_json:
                sid = res_json['data'].get('sid')
                account = res_json['data'].get('account')
                if sid and account:
                    set_user_sid(sid, account)
            return jsonify(res_json)
    except Exception as e:
        logger.error(f"Failed to authenticate with NAS: {e}")
        return jsonify({"success": False, "error": {"code": 500, "message": str(e)}}), 500

@app.route('/photos', methods=['GET'])
def get_photos():
    sid = request.cookies.get('sid')
    username = get_user_from_sid(sid)
    
    if not username:
        logger.warning("Unauthorized access attempt to /photos")
        return jsonify({"error": "Unauthorized"}), 401

    logger.info(f"Fetching photos for user: {username}")

    if not driver:
        return jsonify({"error": "Database driver not initialized. Check server logs for connection errors."}), 500

    try:
        with driver.session() as session:
            query = """
            MATCH (p:Photo)-[:OWNED_BY]->(u:Owner {name: $username})
            RETURN p.id AS id, p.cache_key AS cache_key, p.takentime AS takentime
            ORDER BY p.takentime DESC
            LIMIT 50
            """
            result = session.run(query, username=username)

            photos = [record.data() for record in result]
            return jsonify({
                "owner": username,
                "photos": photos
            })
    except Exception as e:
        logger.error(f"Query Error: {e}")
        return jsonify({
            "error": "Database Query Failed",
            "details": str(e)
        }), 500


@app.route('/graph', methods=['GET'])
def get_graph():
    sid = request.cookies.get('sid')
    username = get_user_from_sid(sid)
    
    if not username:
        logger.warning("Unauthorized access attempt to /graph")
        return jsonify({"error": "Unauthorized"}), 401

    limit = request.args.get('limit', 20, type=int)
    
    if not driver:
        return jsonify({"error": "Database driver not initialized"}), 500

    try:
        with driver.session() as session:
            # Query to get photos and their immediate connections
            query = """
            MATCH (u:Owner {name: $username})<-[:OWNED_BY]-(p:Photo)
            WITH p ORDER BY p.takentime DESC LIMIT $limit
            OPTIONAL MATCH (p)-[r]-(m)
            WHERE NOT m:Owner
            RETURN p, r, m
            """
            result = session.run(query, username=username, limit=limit)
            
            nodes = {}
            links = []
            
            for record in result:
                p = record['p']
                r = record['r']
                m = record['m']
                
                # Add Photo node
                p_id = f"photo_{p.element_id}"
                if p_id not in nodes:
                    nodes[p_id] = {
                        "id": p_id,
                        "label": p.get('filename', 'Photo'),
                        "type": "Photo",
                        "cache_key": p.get('cache_key'),
                        "unit_id": p.get('id'),
                        "takentime": p.get('takentime'),
                        "val": 5 # Node size
                    }

                
                # Add related node and link
                if m is not None:
                    m_label = list(m.labels)[0] if m.labels else "Unknown"
                    m_id = f"{m_label.lower()}_{m.element_id}"
                    if m_id not in nodes:
                        nodes[m_id] = {
                            "id": m_id,
                            "label": m.get('name') or m.get('filename') or m_label,
                            "type": m_label,
                            "val": 3
                        }
                    
                    if r is not None:
                        links.append({
                            "source": p_id,
                            "target": m_id,
                            "type": r.type
                        })

            
            return jsonify({
                "nodes": list(nodes.values()),
                "links": links
            })
    except Exception as e:
        logger.error(f"Graph Query Error: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':

    app.run(host='0.0.0.0', port=5000, debug=True)

