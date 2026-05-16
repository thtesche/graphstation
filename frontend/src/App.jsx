import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Configuration - using relative paths for Synology Web Station compatibility
  const API_BASE = import.meta.env.VITE_API_URL || '/graphstation-api';
  const NAS_URL = window.location.origin;

  useEffect(() => {
    async function initApp() {
      try {
        setLoading(true);
        
        // Fetch photos from our Backend directly. 
        // User authentication check has been removed.
        const photosRes = await fetch(`${API_BASE}/photos`, {
          credentials: 'include'
        });
        
        if (!photosRes.ok) throw new Error(`Backend error: ${photosRes.status}`);
        
        const photosData = await photosRes.json();
        setPhotos(photosData.photos || []);
        
        // Update user state from backend response
        if (photosData.owner) {
          setUser(photosData.owner);
        }

      } catch (err) {
        console.error("Initialization failed:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    initApp();
  }, [API_BASE]);

  if (loading) return <div className="loading">🚀 GraphStation lädt...</div>;
  if (error) return <div className="error">❌ Fehler: {error}</div>;

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>GraphStation</h1>
        <div className="user-info">
          {user ? `Hallo, ${user} 👋` : 'Gast'}
        </div>
      </header>

      <main className="photo-grid">
        {photos.length > 0 ? (
          photos.map(photo => (
            <div key={photo.id} className="photo-card">
              <img 
                src={`${NAS_URL}/photo/webapi/thumb.cgi?api=SYNO.Foto.Thumbnail&method=get&version=1&size=m&cache_key=${photo.cache_key}&id=${photo.id}`} 
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
      </main>
    </div>
  );
}

export default App;

