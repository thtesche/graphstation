# GraphLens 📸🕸️

GraphLens is a lightweight, non-linear photo browser and gallery designed specifically for Synology NAS users. Instead of navigating rigid folder structures, GraphLens allows you to explore your photo collection through its underlying graph of relationships—connecting people, locations, objects, and time.

## 🌟 Features

- **Graph-Based Navigation:** Pivot through your collection by clicking on metadata "neighbors" (Persons, Locations, AI-detected Objects).
- **Lightweight Architecture:** Designed to run on resource-constrained hardware (e.g., Synology NAS with 2GB RAM).
- **Native Integration:** Utilizes Synology's internal session authentication and thumbnail APIs for seamless performance.
- **POLE+O Data Model:** Built on a Labeled Property Graph (LPG) schema using [Memgraph](https://memgraph.com/).

## 📋 Prerequisites

Before setting up GraphLens, ensure your system meets the following requirements:

- **Synology NAS:** Running **DSM 7.x** with **Synology Photos** installed.
- **Web Station:** Installed and configured on your Synology NAS (required for hosting the frontend and Python API).
- **SSH Access:** Enabled on your NAS for automated deployment.
- **Memgraph:** A running instance of Memgraph (typically via Docker on the NAS).
- **Metadata Sync:** Data must be synced using [synofoto-graph-sync](https://github.com/thtesche/synofoto-graph-sync).

## 🏗️ Architecture

- **Database:** Memgraph (Docker-based) for high-performance graph traversal.
- **Backend:** Lightweight Python (FastAPI/Flask) running bare-metal on Synology Web Station.
- **Frontend:** React SPA (Static) hosted on Synology Web Station.

## 🚀 Quick Start

*Detailed setup instructions coming soon.*

1. **Prepare Memgraph:** Run Memgraph in Docker on your NAS.
2. **Sync Metadata:** Use [synofoto-graph-sync](https://github.com/thtesche/synofoto-graph-sync) to populate the graph from Synology Photos.
3. **Deploy Backend:** Place the Python API script in Synology Web Station.
4. **Deploy Frontend:** Build the React app and host the static files.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
