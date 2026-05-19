import React, { useState, useEffect, useRef, Component } from 'react';
import ForceGraph2D from 'react-force-graph-2d';


import './App.css';

function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
}

function setCookie(name, value, days) {
  const maxAge = days * 24 * 60 * 60;
  document.cookie = `${name}=${value}; max-age=${maxAge}; path=/`;
}

function deleteCookie(name) {
  document.cookie = `${name}=; max-age=0; path=/`;
}

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
  const [authData, setAuthData] = useState({
    sid: getCookie('sid'),
    synotoken: getCookie('synotoken')
  });
  const [loginForm, setLoginForm] = useState({ account: '', password: '', otp: '' });
  const [loginError, setLoginError] = useState(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [user, setUser] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [viewMode, setViewMode] = useState('group'); // 'group', 'filter', or 'graph'
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });
  const [groupedPhotos, setGroupedPhotos] = useState([]);
  const [groupedLoading, setGroupedLoading] = useState(false);
  const [groupKey, setGroupKey] = useState('family'); // 'family', 'person', 'location'
  const [loading, setLoading] = useState(true);
  const [photosLoading, setPhotosLoading] = useState(false);
  const [error, setError] = useState(null);
  const [thumbnailSize, setThumbnailSize] = useState(() => {
    return getCookie('thumbnailSize') || 'm';
  });

  const [selectedPhoto, setSelectedPhoto] = useState(null);

  // Filter States
  const [filters, setFilters] = useState({ families: [], persons: [], countries: [] });
  const [selectedFamily, setSelectedFamily] = useState('');
  const [selectedPerson, setSelectedPerson] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('');

  useEffect(() => {
    setCookie('thumbnailSize', thumbnailSize, 14);
  }, [thumbnailSize]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setSelectedPhoto(null);
      }
    };
    if (selectedPhoto) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedPhoto]);

  const fgRef = useRef();
  const imageCache = useRef({});

  console.log("App component executing...");



  // Configuration - using relative paths for Synology Web Station compatibility
  const API_BASE = '/graphstation-api';
  const NAS_BASE = `${window.location.protocol}//${window.location.hostname}`;

  const getThumbnailUrl = (id, cacheKey) => {
    let url = `${NAS_BASE}:5001/synofoto/api/v2/p/Thumbnail/get?id=${id}&cache_key="${id}_${cacheKey}"&type="unit"&size="${thumbnailSize}"`;
    if (authData.synotoken) url += `&SynoToken=${authData.synotoken}`;
    if (authData.sid) url += `&_sid=${authData.sid}`;
    return url;
  };

  const getOriginalUrl = (id, cacheKey) => {
    let url = `${NAS_BASE}:5001/webapi/entry.cgi?cache_key="${id}_${cacheKey}"&unit_id=[${id}]&api="SYNO.Foto.Download"&method="download"&version=2`;
    if (authData.synotoken) url += `&SynoToken=${authData.synotoken}`;
    if (authData.sid) url += `&_sid=${authData.sid}`;
    return url;
  };

  const handleImageError = (e) => {
    const img = e.target;
    let retries = parseInt(img.dataset.retries || '0', 10);
    if (retries < 5) {
      setTimeout(() => {
        img.dataset.retries = retries + 1;
        const originalSrc = img.src.split('&retry=')[0];
        img.src = `${originalSrc}&retry=${Date.now()}`;
      }, 2000);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError(null);
    try {
      const response = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          account: loginForm.account,
          passwd: loginForm.password,
          otp_code: loginForm.otp
        })
      });

      const result = await response.json();
      if (result.success) {
        const { sid, synotoken } = result.data;
        setCookie('sid', sid, 14); // 14 days = 2 weeks
        setCookie('synotoken', synotoken, 14);
        setAuthData({ sid, synotoken });
      } else {
        setLoginError(`Login fehlgeschlagen: Code ${result.error?.code || 'Unbekannt'}`);
      }
    } catch (err) {
      setLoginError(`Netzwerkfehler: ${err.message}`);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    deleteCookie('sid');
    deleteCookie('synotoken');
    setAuthData({ sid: null, synotoken: null });
    setSelectedFamily('');
    setSelectedPerson('');
    setSelectedCountry('');
    setFilters({ families: [], persons: [], countries: [] });
  };

  // Fetch filters and graph data once upon login
  useEffect(() => {
    async function loadInitialData() {
      if (!authData.sid || !authData.synotoken) return;
      try {
        setLoading(true);
        setError(null);
        
        // Fetch filters
        const filtersRes = await fetch(`${API_BASE}/filters`, { credentials: 'include' });
        if (filtersRes.ok) {
          const filtersData = await filtersRes.json();
          setFilters(filtersData);
        }

        // Fetch graph data
        const graphRes = await fetch(`${API_BASE}/graph?limit=30`, { credentials: 'include' });
        if (!graphRes.ok) {
          if (graphRes.status === 401) {
            handleLogout();
            return;
          }
        } else {
          const gData = await graphRes.json();
          setGraphData(gData);
        }
      } catch (err) {
        console.error("Initial load failed:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadInitialData();
  }, [authData.sid, authData.synotoken]);

  // Fetch photos whenever filters change
  useEffect(() => {
    async function fetchPhotos() {
      if (!authData.sid || !authData.synotoken) return;
      try {
        setPhotosLoading(true);
        
        const params = new URLSearchParams();
        if (selectedFamily) params.append('family', selectedFamily);
        if (selectedPerson) params.append('person', selectedPerson);
        if (selectedCountry) params.append('country', selectedCountry);
        
        const queryString = params.toString() ? `?${params.toString()}` : '';
        const photosRes = await fetch(`${API_BASE}/photos${queryString}`, { credentials: 'include' });

        if (!photosRes.ok) {
          if (photosRes.status === 401) {
            handleLogout();
            return;
          }
          const errorData = await photosRes.json().catch(() => ({}));
          const errorMsg = errorData.details || errorData.error || `Status ${photosRes.status}`;
          throw new Error(`Backend error: ${errorMsg}`);
        }

        const photosData = await photosRes.json();
        setPhotos(photosData.photos || []);
        if (photosData.owner) setUser(photosData.owner);
      } catch (err) {
        console.error("Failed to fetch photos:", err);
      } finally {
        setPhotosLoading(false);
      }
    }
    fetchPhotos();
  }, [authData.sid, authData.synotoken, selectedFamily, selectedPerson, selectedCountry]);

  // Window resize handler for graph sizing
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch grouped photos
  useEffect(() => {
    async function fetchGroupedPhotos() {
      if (!authData.sid || !authData.synotoken || viewMode !== 'group') return;
      try {
        setGroupedLoading(true);
        const res = await fetch(`${API_BASE}/photos/grouped?by=${groupKey}`, { credentials: 'include' });
        if (!res.ok) {
          if (res.status === 401) {
            handleLogout();
            return;
          }
          throw new Error(`Backend error: status ${res.status}`);
        }
        const data = await res.json();
        setGroupedPhotos(data || []);
      } catch (err) {
        console.error("Failed to fetch grouped photos:", err);
      } finally {
        setGroupedLoading(false);
      }
    }
    fetchGroupedPhotos();
  }, [authData.sid, authData.synotoken, viewMode, groupKey]);

  console.log("Rendering Graph with:", graphData.nodes.length, "nodes and", graphData.links.length, "links");

  if (!authData.sid || !authData.synotoken) {
    return (
      <div className="app-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div className="login-card" style={{ background: '#1e293b', padding: '2rem', borderRadius: '8px', width: '300px', border: '1px solid #334155' }}>
          <h2 style={{ marginTop: 0, marginBottom: '1.5rem', textAlign: 'center' }}>NAS Login</h2>
          {loginError && <div style={{ color: '#ef4444', marginBottom: '1rem', fontSize: '0.9rem', textAlign: 'center' }}>{loginError}</div>}
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <input 
              type="text" 
              placeholder="Account" 
              value={loginForm.account}
              onChange={e => setLoginForm({...loginForm, account: e.target.value})}
              required
              style={{ padding: '0.75rem', borderRadius: '4px', border: '1px solid #475569', background: '#0f172a', color: 'white' }}
            />
            <input 
              type="password" 
              placeholder="Passwort" 
              value={loginForm.password}
              onChange={e => setLoginForm({...loginForm, password: e.target.value})}
              required
              style={{ padding: '0.75rem', borderRadius: '4px', border: '1px solid #475569', background: '#0f172a', color: 'white' }}
            />
            <input 
              type="text" 
              placeholder="OTP Code (Optional)" 
              value={loginForm.otp}
              onChange={e => setLoginForm({...loginForm, otp: e.target.value})}
              style={{ padding: '0.75rem', borderRadius: '4px', border: '1px solid #475569', background: '#0f172a', color: 'white' }}
            />
            <button 
              type="submit" 
              disabled={isLoggingIn}
              style={{ padding: '0.75rem', borderRadius: '4px', border: 'none', background: '#3b82f6', color: 'white', fontWeight: 'bold', cursor: isLoggingIn ? 'not-allowed' : 'pointer', marginTop: '0.5rem' }}
            >
              {isLoggingIn ? 'Logge ein...' : 'Einloggen'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (loading) return <div className="loading">🚀 GraphStation lädt...</div>;

  if (error) return <div className="error">❌ Fehler: {error}</div>;

  return (
    <div className="app-container">
      <aside className="sidebar">
        <nav className="sidebar-nav">
          <button 
            className={`nav-item ${viewMode === 'group' ? 'active' : ''}`}
            onClick={() => setViewMode('group')}
          >
            🗂️ Gruppiert
          </button>
          <button 
            className={`nav-item ${viewMode === 'filter' ? 'active' : ''}`}
            onClick={() => setViewMode('filter')}
          >
            🔍 Filtern
          </button>
          <button 
            className={`nav-item ${viewMode === 'graph' ? 'active' : ''}`}
            onClick={() => setViewMode('graph')}
          >
            🌐 Graph
          </button>
        </nav>
      </aside>

      <header className="app-header">
        <h1>GraphStation</h1>
        <div className="header-controls">
          <div className="stats-info" style={{ marginRight: '1rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Nodes: {graphData.nodes.length} | Links: {graphData.links.length}
          </div>
          
          <div className="size-selector-chips" style={{ display: 'flex', alignItems: 'center', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '8px', padding: '2px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
            {['sm', 'm', 'xl'].map(size => (
              <button
                key={size}
                onClick={() => setThumbnailSize(size)}
                style={{
                  background: thumbnailSize === size ? 'var(--accent-color)' : 'transparent',
                  color: thumbnailSize === size ? 'var(--bg-color)' : 'var(--text-secondary)',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '0.35rem 0.75rem',
                  fontSize: '0.8rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                  transition: 'all 0.2s ease',
                }}
              >
                {size}
              </button>
            ))}
          </div>

          <div className="user-info" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span>{user ? `Hallo, ${user} 👋` : 'Gast'}</span>
            <button onClick={handleLogout} style={{ background: 'transparent', border: '1px solid #475569', color: '#94a3b8', padding: '0.25rem 0.5rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="content-area">
        {viewMode === 'filter' && (
          <div className="grid-container">
            <div className="filter-bar">
              <div className="filter-group">
                <label htmlFor="filter-family">Familie</label>
                <select
                  id="filter-family"
                  value={selectedFamily}
                  onChange={(e) => setSelectedFamily(e.target.value)}
                >
                  <option value="">Alle Familien</option>
                  {filters.families.map(fam => (
                    <option key={fam} value={fam}>{fam}</option>
                  ))}
                </select>
              </div>

              <div className="filter-group">
                <label htmlFor="filter-person">Person</label>
                <select
                  id="filter-person"
                  value={selectedPerson}
                  onChange={(e) => setSelectedPerson(e.target.value)}
                >
                  <option value="">Alle Personen</option>
                  {filters.persons.map(pers => (
                    <option key={pers} value={pers}>{pers}</option>
                  ))}
                </select>
              </div>

              <div className="filter-group">
                <label htmlFor="filter-country">Land</label>
                <select
                  id="filter-country"
                  value={selectedCountry}
                  onChange={(e) => setSelectedCountry(e.target.value)}
                >
                  <option value="">Alle Länder</option>
                  {filters.countries.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {(selectedFamily || selectedPerson || selectedCountry) && (
                <button
                  className="clear-filters-btn"
                  onClick={() => {
                    setSelectedFamily('');
                    setSelectedPerson('');
                    setSelectedCountry('');
                  }}
                >
                  ✕ Filter zurücksetzen
                </button>
              )}
            </div>

            <div className={`photo-grid size-${thumbnailSize} ${photosLoading ? 'loading-opacity' : ''}`}>
              {photos.length > 0 ? (
                photos.map(photo => (
                  <div key={photo.id} className="photo-card" onClick={() => setSelectedPhoto(photo)}>
                    <img
                      src={getThumbnailUrl(photo.id, photo.cache_key)}
                      alt="NAS Photo"
                      loading="lazy"
                      onError={handleImageError}
                    />
                    <div className="photo-date">
                      {new Date(photo.takentime * 1000).toLocaleDateString()}
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-photos">
                  {photosLoading ? 'Suche Fotos...' : 'Keine Fotos gefunden.'}
                </div>
              )}
            </div>
          </div>
        )}

        {viewMode === 'group' && (
          <div className="group-container">
            <div className="group-header">
              <div className="group-chips">
                <button
                  className={`group-chip ${groupKey === 'family' ? 'active' : ''}`}
                  onClick={() => setGroupKey('family')}
                >
                  👪 Familie
                </button>
                <button
                  className={`group-chip ${groupKey === 'person' ? 'active' : ''}`}
                  onClick={() => setGroupKey('person')}
                >
                  👤 Person
                </button>
                <button
                  className={`group-chip ${groupKey === 'location' ? 'active' : ''}`}
                  onClick={() => setGroupKey('location')}
                >
                  📍 Land/Ort
                </button>
              </div>
            </div>

            <div className={`grouped-content ${groupedLoading ? 'loading-opacity' : ''}`}>
              {groupedPhotos.length > 0 ? (
                groupedPhotos.map(group => (
                  <div key={group.group_name} className="group-section">
                    <h2 className="group-section-title">
                      {groupKey === 'family' && '👪 '}
                      {groupKey === 'person' && '👤 '}
                      {groupKey === 'location' && '📍 '}
                      {group.group_name} <span className="group-count">({group.photos.length})</span>
                    </h2>
                    <div className={`photo-grid size-${thumbnailSize}`}>
                      {group.photos.map(photo => (
                        <div key={photo.id} className="photo-card" onClick={() => setSelectedPhoto(photo)}>
                          <img
                            src={getThumbnailUrl(photo.id, photo.cache_key)}
                            alt="NAS Photo"
                            loading="lazy"
                            onError={handleImageError}
                          />
                          <div className="photo-date">
                            {photo.takentime ? new Date(photo.takentime * 1000).toLocaleDateString() : 'Unbekannt'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-photos">
                  {groupedLoading ? 'Gruppiere Fotos...' : 'Keine gruppierten Fotos gefunden.'}
                </div>
              )}
            </div>
          </div>
        )}

        {viewMode === 'graph' && (
          <ErrorBoundary>
            <div className="graph-view" style={{ width: '100%', height: 'calc(100vh - 70px)', background: '#020617' }}>
              <ForceGraph2D
                graphData={graphData}
                width={windowSize.width - 240}
                height={windowSize.height - 70}
                nodeLabel="label"
                nodeAutoColorBy="type"
                linkDirectionalParticles={1}
                nodeCanvasObject={(node, ctx, globalScale) => {
                  const size = node.val || 3;
                  if (node.type === 'Photo') {
                    const imgUrl = getThumbnailUrl(node.unit_id, node.cache_key);

                    const imageKey = `${node.id}_${thumbnailSize}`;
                    if (!imageCache.current[imageKey]) {
                      const img = new Image();
                      img.src = imgUrl;
                      img.retries = 0;
                      img.onerror = () => {
                        if (img.retries < 5) {
                          setTimeout(() => {
                            img.retries++;
                            const originalSrc = imgUrl.split('&retry=')[0];
                            img.src = `${originalSrc}&retry=${Date.now()}`;
                          }, 2000);
                        }
                      };
                      imageCache.current[imageKey] = img;
                    }

                    const img = imageCache.current[imageKey];

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
                    } catch (e) { }
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
                  if (node.type === 'Photo') {
                    setSelectedPhoto({
                      id: node.unit_id,
                      cache_key: node.cache_key,
                      takentime: node.takentime
                    });
                  }
                }}
              />
            </div>
          </ErrorBoundary>
        )}
      </main>

      {selectedPhoto && (
        <div className="overlay-modal" onClick={() => setSelectedPhoto(null)}>
          <button className="overlay-close" onClick={() => setSelectedPhoto(null)}>✕</button>
          <div className="overlay-image-container" onClick={(e) => e.stopPropagation()}>
            <img 
              className="overlay-image"
              src={getOriginalUrl(selectedPhoto.id, selectedPhoto.cache_key)} 
              alt="NAS Original Photo" 
            />
          </div>
          {selectedPhoto.takentime && (
            <div className="overlay-metadata" onClick={(e) => e.stopPropagation()}>
              📅 {new Date(selectedPhoto.takentime * 1000).toLocaleString()}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
