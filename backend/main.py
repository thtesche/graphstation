import os
from flask import Flask, jsonify, request
from flask_cors import CORS
from neo4j import GraphDatabase
from dotenv import load_dotenv

# Load .env from root if present
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

app = Flask(__name__)
CORS(app)

# Memgraph configuration
MEMGRAPH_HOST = os.getenv('MEMGRAPH_HOST', 'localhost')
MEMGRAPH_PORT = os.getenv('MEMGRAPH_PORT', '7687')
MEMGRAPH_USER = os.getenv('MEMGRAPH_USER', '')
MEMGRAPH_PASSWORD = os.getenv('MEMGRAPH_PASSWORD', '')

# Neo4j Driver
driver = GraphDatabase.driver(
    f"bolt://{MEMGRAPH_HOST}:{MEMGRAPH_PORT}",
    auth=(MEMGRAPH_USER, MEMGRAPH_PASSWORD) if MEMGRAPH_USER else None
)

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "ok", "message": "GraphStation Backend is running"})

@app.route('/photos', methods=['GET'])
def get_photos():
    # Detect user from Synology Header (passed by Web Station if configured)
    remote_user = request.headers.get('Remote-User') or request.environ.get('REMOTE_USER')
    
    with driver.session() as session:
        # Simple query to get photos. If remote_user is present, we can filter by Owner.
        if remote_user:
            query = """
            MATCH (u:Owner {name: $username})-[:OWNS]->(p:Photo)
            RETURN p.unit_id AS id, p.cache_key AS cache_key, p.takentime AS takentime
            ORDER BY p.takentime DESC
            LIMIT 50
            """
            result = session.run(query, username=remote_user)
        else:
            query = """
            MATCH (p:Photo)
            RETURN p.unit_id AS id, p.cache_key AS cache_key, p.takentime AS takentime
            ORDER BY p.takentime DESC
            LIMIT 50
            """
            result = session.run(query)
            
        photos = [record.data() for record in result]
        return jsonify(photos)

if __name__ == '__main__':
    # For local development
    app.run(host='0.0.0.0', port=5000, debug=True)
