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
env_path = os.path.join(os.path.dirname(__file__), '.env')
if os.path.exists(env_path):
    load_dotenv(env_path)
    logger.info(f"Loaded .env from {env_path}")
else:
    load_dotenv()
    logger.info("Loaded .env from current directory or environment")

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
try:
    driver = GraphDatabase.driver(
        f"bolt://{MEMGRAPH_HOST}:{MEMGRAPH_PORT}",
        auth=(MEMGRAPH_USER, MEMGRAPH_PASSWORD) if MEMGRAPH_USER else None
    )
except Exception as e:
    logger.error(f"Failed to create driver: {e}")

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "ok", "message": "GraphStation Backend is running"})

@app.route('/photos', methods=['GET'])
def get_photos():
    # User authentication has been removed as per request.
    # We now always use the DEFAULT_OWNER for queries.
    username = DEFAULT_OWNER
    logger.info(f"Fetching photos for user: {username} (Auth disabled)")

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
                "photos": photos
            })
    except Exception as e:
        logger.error(f"Query Error: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)

