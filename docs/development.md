# Local Development Guide

This guide explains how to set up and run GraphStation on your local machine for development purposes.

## Prerequisites

Ensure you have the following installed:

- **Node.js** (v18 or higher recommended) & **npm**
- **Python 3.9+**
- **Memgraph** (running via Docker)

---

## 1. Environment Setup

First, create your local environment configuration by copying the template and running the setup script:

```bash
./setup_local.sh
```

This script will:
1. Create a `.env` file from `.env.template`.
2. Prompt you for your NAS credentials (to configure paths).
3. Install frontend dependencies (`npm install`).
4. Make deployment scripts executable.

**Note:** For local development, ensure `MEMGRAPH_HOST` in your `.env` points to where your Memgraph instance is running (e.g., `localhost` if running via Docker locally).

---

## 2. Running the Backend

The backend is a Flask application. To run it locally:

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Start the server:
   ```bash
   python main.py
   ```

The API will be available at `http://localhost:5000`.

---

## 3. Running the Frontend

The frontend is a React application built with Vite.

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Start the development server:
   ```bash
   npm run dev
   ```

The frontend will typically be available at `http://localhost:5173`.

**Important for Frontend-Backend Communication:**
During local development, you may encounter CORS issues or cookie problems because the frontend and backend are on different ports/domains. 

- **Development Mode:** You can enable `VITE_DEV_MODE=true` in your `.env` file. This enables a feature where clicking on your username in the UI copies the session cookie, which can be manually applied to your browser for testing purposes.
- **Proxying:** For a more seamless experience, consider configuring a proxy in `vite.config.js` to redirect `/api` requests to `http://localhost:5000`.

---

## 4. Working with the Graph (Memgraph)

Since GraphStation relies heavily on Memgraph, you should have a Memgraph instance running. The easiest way is using Docker:

```bash
docker run -d \
    --name memgraph-dev \
    -p 7687:7687 -p 3000:3000 \
    memgraph/memgraph
```

You can use **Memgraph Lab** (accessible at `http://localhost:3000`) to inspect your data and run Cypher queries manually.

---

## Summary of Commands

| Task | Command |
|---|---|
| Initial Setup | `./setup_local.sh` |
| Start Backend | `cd backend && python main.py` |
| Start Frontend | `cd frontend && npm run dev` |
| Install Python Deps | `pip install -r backend/requirements.txt` |
| Install JS Deps | `npm install` (in `frontend/`) |
