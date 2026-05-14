import { useState } from 'react'

function App() {
  return (
    <div className="container">
      <header>
        <h1>GraphLens 📸🕸️</h1>
        <p>A lightweight graph-based photo browser for Synology NAS</p>
      </header>
      <main>
        <div className="card">
          <h2>Hello World!</h2>
          <p>
            The frontend is ready for development.
          </p>
          <div className="status-badge">Status: Online</div>
        </div>
      </main>
      <footer>
        <p>Powered by Memgraph & React</p>
      </footer>
    </div>
  )
}

export default App
