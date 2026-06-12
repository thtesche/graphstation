# Configuration Reference

This document lists all environment variables used by GraphStation. These should be configured in a `.env` file in the project root or within the `backend/` directory depending on your deployment method.

## Server & Network Connection

| Variable | Description | Default | Example |
|---|---|---|---|
| `GRAPHSTATION_HOST` | The IP address or domain of your Synology NAS (used for DSM authentication). | `localhost` | `192.168.0.10` |
| `GRAPHSTATION_USER` | Your Synology DSM username. | - | `admin` |
| `GRAPHSTATION_FRONTEND_PATH` | The absolute path on the NAS where the frontend files are stored. | `/volume1/web/graphstation_frontend` | `/volume1/web/graphstation_frontend` |
| `GRAPHSTATION_BACKEND_PATH` | The absolute path on the NAS where the backend API is stored. | `/volume1/web/graphstation_frontend/api` | `/volume1/web/graphstation_frontend/api` |
| `GRAPHSTATION_DOCKER_PATH` | The directory on the target machine where Docker deployment files will be placed. | - | `~/graphstation_docker` |
| `SYNOLOGY_URL` | The full URL (including protocol and port) of your Synology NAS. Used for API authentication. | - | `http://192.168.0.10:5000` |

## Backend API Configuration

| Variable | Description | Default | Example |
|---|---|---|---|
| `GRAPHSTATION_API_URL` | The URL that the React frontend uses to communicate with the backend API. | - | `http://192.168.0.10:5000/graphstation-api` |
| `DSM_PORT` | The port used by your Synology DSM service (if not using `SYNOLOGY_URL`). | `5000` | `5001` |

## Memgraph Configuration

| Variable | Description | Default | Example |
|---|---|---|---|
| `MEMGRAPH_HOST` | The hostname or IP address of the Memgraph instance. | `localhost` | `192.168.0.10` |
| `MEMGRAPH_PORT` | The port used by Memgraph (Bolt protocol). | `7687` | `7687` |
| `MEMGRAPH_USER` | Username for Memgraph authentication. | (empty) | `admin` |
| `MEMGRAPH_PASSWORD` | Password for Memgraph authentication. | (empty) | `password123` |

## Application Settings

| Variable | Description | Default | Example |
|---|---|---|---|
| `DEFAULT_OWNER` | The fallback username used if no DSM session is detected. | `thtesche` | `myuser` |
| `VITE_DEV_MODE` | Enables a development feature to manually copy/paste session cookies for easier local testing. | `false` | `true` |

---

*Note: Always use the `.env.template` as a starting point when creating your configuration.*
