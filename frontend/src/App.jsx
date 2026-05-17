import React, { useState, useEffect, useRef, Component } from 'react';
import ForceGraph2D from 'react-force-graph-2d';


import './App.css';

// Simple Error Boundary
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', color: '#ef4444', background: '#0f172a', height: '100vh' }}>
          <h2>Graph Error</h2>
          <pre>{this.state.error?.toString()}</pre>
          <button onClick={() => window.location.reload()}>Reload App</button>
        </div>
      );
    }
    return this.props.children;
  }
}


function App() {
  const [user, setUser] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'graph'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const fgRef = useRef();
  const imageCache = useRef({});

  console.log("App component executing...");



  // Configuration - using relative paths for Synology Web Station compatibility
  const API_BASE = '/graphstation-api';
  const NAS_BASE = `${window.location.protocol}//${window.location.hostname}`;

  useEffect(() => {
    async function initApp() {
      try {
        setLoading(true);
        const photosRes = await fetch(`${API_BASE}/photos`, { credentials: 'include' });
        
        if (!photosRes.ok) {
          const errorData = await photosRes.json().catch(() => ({}));
          const errorMsg = errorData.details || errorData.error || `Status ${photosRes.status}`;
          throw new Error(`Backend error: ${errorMsg}`);
        }
        
        const photosData = await photosRes.json();
        setPhotos(photosData.photos || []);
        if (photosData.owner) setUser(photosData.owner);

        // Pre-fetch graph data
        const graphRes = await fetch(`${API_BASE}/graph?limit=30`, { credentials: 'include' });
        if (graphRes.ok) {
          const gData = await graphRes.json();
          setGraphData(gData);
        }

      } catch (err) {
        console.error("Initialization failed:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    initApp();
  }, []);

  const toggleView = () => {
    setViewMode(viewMode === 'grid' ? 'graph' : 'grid');
  };

  console.log("Rendering Graph with:", graphData.nodes.length, "nodes and", graphData.links.length, "links");

  if (loading) return <div className="loading">🚀 GraphStation lädt...</div>;

  if (error) return <div className="error">❌ Fehler: {error}</div>;

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>GraphStation</h1>
        <div className="header-controls">
          <div className="stats-info" style={{ marginRight: '1rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Nodes: {graphData.nodes.length} | Links: {graphData.links.length}
          </div>
          <button onClick={toggleView} className="view-toggle">
            {viewMode === 'grid' ? '🌐 Graph Ansicht' : '📱 Grid Ansicht'}
          </button>
          <div className="user-info">
            {user ? `Hallo, ${user} 👋` : 'Gast'}
          </div>
        </div>
      </header>

      <main className="content-area">
        {viewMode === 'grid' ? (
          <div className="photo-grid">
            {photos.length > 0 ? (
              photos.map(photo => (
                <div key={photo.id} className="photo-card">
                  <img 
                    src={`${NAS_BASE}:5001/synofoto/api/v2/p/Thumbnail/get?id=${photo.id}&cache_key="${photo.id}_${photo.cache_key}"&type="unit"&size="m"`} 
                    alt="NAS Photo"
                    loading="lazy"
                  />
                  <div className="photo-date">
                    {new Date(photo.takentime * 1000).toLocaleDateString()}
                  </div>
                </div>
              ))
            ) : (
              <div className="no-photos">Keine Fotos gefunden.</div>
            )}
          </div>
        ) : (
          <ErrorBoundary>
            <div className="graph-view" style={{ width: '100vw', height: 'calc(100vh - 70px)', background: '#020617' }}>
              <ForceGraph2D
                graphData={graphData}
                width={window.innerWidth}
                height={window.innerHeight - 70}
                nodeLabel="label"
                nodeAutoColorBy="type"
                linkDirectionalParticles={1}
                nodeCanvasObject={(node, ctx, globalScale) => {
                  const size = node.val || 3;
                  if (node.type === 'Photo') {
                    const imgUrl = `${NAS_BASE}:5001/synofoto/api/v2/p/Thumbnail/get?id=${node.unit_id}&cache_key="${node.unit_id}_${node.cache_key}"&type="unit"&size="m"`;
                    
                    if (!imageCache.current[node.id]) {
                      const img = new Image();
                      img.src = imgUrl;
                      imageCache.current[node.id] = img;
                    }
                    
                    const img = imageCache.current[node.id];
                    
                    ctx.save();
                    ctx.beginPath();
                    ctx.arc(node.x, node.y, size, 0, 2 * Math.PI, false);
                    ctx.clip();
                    try {
                      if (img.complete && img.naturalWidth !== 0) {
                        ctx.drawImage(img, node.x - size, node.y - size, size * 2, size * 2);
                      } else {
                        ctx.fillStyle = '#1e293b';
                        ctx.fill();
                      }
                    } catch (e) {}
                    ctx.strokeStyle = '#38bdf8';
                    ctx.lineWidth = 1 / globalScale;
                    ctx.stroke();
                    ctx.restore();
                  } else {
                    // Metadata node
                    ctx.beginPath();
                    ctx.arc(node.x, node.y, size, 0, 2 * Math.PI, false);
                    ctx.fillStyle = node.color || '#818cf8';
                    ctx.fill();
                    
                    // Label
                    const label = node.label;
                    const fontSize = 10 / globalScale;
                    ctx.font = `${fontSize}px Inter, sans-serif`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillStyle = 'white';
                    ctx.fillText(label, node.x, node.y + size + fontSize);
                  }
                }}
                onNodeClick={node => {
                  if (node.type === 'Photo') setViewMode('grid');
                }}
              />

            </div>
          </ErrorBoundary>








        )}
      </main>
    </div>
  );
}

export default App;
