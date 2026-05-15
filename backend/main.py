import os
import requests
import logging
from flask import Flask, jsonify, request
from flask_cors import CORS
from neo4j import GraphDatabase
from dotenv import load_dotenv

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load .env from same directory if present
env_path = os.path.join(os.path.dirname(__file__), '.env')
if os.path.exists(env_path):
    load_dotenv(env_path)
    logger.info(f"Loaded .env from {env_path}")
else:
    # Try current directory as fallback
    load_dotenv()
    logger.info("Loaded .env from current directory or environment")

app = Flask(__name__)
CORS(app, supports_credentials=True)

# Configuration
MEMGRAPH_HOST = os.getenv('MEMGRAPH_HOST', 'localhost')
MEMGRAPH_PORT = os.getenv('MEMGRAPH_PORT', '7687')
MEMGRAPH_USER = os.getenv('MEMGRAPH_USER', '')
MEMGRAPH_PASSWORD = os.getenv('MEMGRAPH_PASSWORD', '')
DEFAULT_OWNER = os.getenv('DEFAULT_OWNER', 'thtesche')

logger.info(f"Connecting to Memgraph at {MEMGRAPH_HOST}:{MEMGRAPH_PORT} as user '{MEMGRAPH_USER}'")

# Neo4j Driver
try:
    driver = GraphDatabase.driver(
        f"bolt://{MEMGRAPH_HOST}:{MEMGRAPH_PORT}",
        auth=(MEMGRAPH_USER, MEMGRAPH_PASSWORD) if MEMGRAPH_USER else None
    )
except Exception as e:
    logger.error(f"Failed to create driver: {e}")

def get_synology_user():
    sid = request.cookies.get('id')
    if not sid:
        return None
    
    try:
        # Synology API for user info
        url = f"http://localhost:5000/webapi/auth.cgi?api=SYNO.API.Auth&version=3&method=getinfo&_sid={sid}"
        response = requests.get(url, timeout=2)
        data = response.json()
        if data.get('success'):
            return data['data'].get('user')
    except Exception as e:
        logger.error(f"Synology Auth Error: {e}")
    
    return None

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "ok", "message": "GraphStation Backend is running"})

@app.route('/photos', methods=['GET'])
def get_photos():
    username = get_synology_user()
    
    if not username:
        username = request.headers.get('Remote-User') or request.environ.get('REMOTE_USER')
        
    if not username:
        username = DEFAULT_OWNER
        is_mocked = True
    else:
        is_mocked = False

    try:
        with driver.session() as session:
            query = """
            MATCH (u:Owner {name: $username})-[:OWNS]->(p:Photo)
            RETURN p.unit_id AS id, p.cache_key AS cache_key, p.takentime AS takentime
            ORDER BY p.takentime DESC
            LIMIT 50
            """
            result = session.run(query, username=username)
            photos = [record.data() for record in result]
            return jsonify({
                "owner": username,
                "is_mocked": is_mocked,
                "photos": photos
            })
    except Exception as e:
        logger.error(f"Query Error: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
