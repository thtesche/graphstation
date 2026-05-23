# Deployment Option A: Synology NAS (Web Station)

This guide describes the configuration of the Synology NAS for GraphStation and the use of the automated deployment scripts in the event that **all components are hosted directly on the NAS**.

## 1. Local Setup (Development Machine)

Before you begin deployment to the NAS, set up your local environment:

1. Ensure **Node.js** and **npm** are installed on your machine.
2. Run the setup script in the project's root directory:
   ```bash
   ./setup_local.sh
   ```
3. The script installs frontend dependencies and prompts you for your NAS credentials to automatically create a `.env` file for subsequent deployment.

## 2. Web Station Configuration (on the NAS)

To host GraphStation, web services and portals must be configured in Synology Web Station.

### Frontend (Static Website)
1. Open **Web Station** on your DSM.
2. Go to **Web Service** and click **Create**.
3. Select **Static Website**.
4. **Name:** `graphstation-frontend`
5. **Document Root:** Select the destination folder (e.g., `/web/graphstation_frontend`).
6. Click **Next** and **Create**.

### Backend (Python Service)
The API is based on a Python Script Language service:

1. Open **Web Station** > **Script Language Settings**.
2. Click **Create** and select **Python 3.9**.
3. **Name:** `graphstation-backend`
4. Click **Next** and **Create**.

### Create Web Service (for the Backend)
After creating the Script Language profile, create the actual web service:

1. Go to **Web Service** > **Create** > **Script Language Service** > **Python**.
2. **Name:** `graphstation-backend-service`
3. **Document Root:** Select the API folder (e.g., `/web/graphstation_frontend/api`).
4. **WSGI File:** Select the `wsgi.py` file in the API folder.
5. **Callable:** Enter `application` (this corresponds to the name inside `wsgi.py`).
6. Click **Next** and **Create**.

### Web Portals (Access Paths)
You must create portals so that the services are accessible over the network:

1. **Frontend Portal:**
   - Service: `graphstation-frontend`
   - Type: **Alias**
   - Alias: `graphstation` (accessible via `http://nas-ip/graphstation`)
2. **Backend Portal:**
   - Service: `graphstation-backend`
   - Type: **Alias**
   - Alias: `graphstation-api`
   - **Note:** Synology does not allow slashes in the alias name.

## 3. Local Environment Configuration (Manual)

If the `./setup_local.sh` script was not used, ensure that your local `.env` file is manually configured correctly:

```bash
# Server Connection
GRAPHSTATION_HOST=192.168.0.x
GRAPHSTATION_USER=your_user
GRAPHSTATION_FRONTEND_PATH=/volume1/web/graphstation_frontend
GRAPHSTATION_BACKEND_PATH=/volume1/web/graphstation_frontend/api

# Backend API URL (for the React Frontend)
GRAPHSTATION_API_URL=https://your-domain/graphstation-api

# Memgraph Configuration (used by the backend)
MEMGRAPH_HOST=192.168.0.x
MEMGRAPH_PORT=7687
```

## 4. Deployment

The project uses a central deployment script to transfer the frontend and backend to the NAS.

### Deploy Everything (Default)
```bash
./deploy.sh
```

### Deploy Frontend Only
```bash
./deploy.sh frontend
```

### Deploy Backend Only
```bash
./deploy.sh backend
```

## 5. Installing Backend Dependencies

After the initial deployment, the Python modules must be installed on the NAS:

1. Connect to your NAS via SSH.
2. Navigate to the API folder:
   ```bash
   cd /volume1/web/graphstation_frontend/api
   ```
3. Install the requirements:
   ```bash
   python3 -m pip install -r requirements.txt
   ```

*Note: If you have SSH access, ensure that the user has write permissions in the web folder.*

## 6. Authentication & User Recognition

GraphStation automatically attempts to detect the currently logged-in DSM user (via the `id` cookie). If no session is found, the `DEFAULT_OWNER` from the `.env` is used.

---

## 7. Security Notes

### IP Address Access Restriction
Since GraphStation relies on detecting DSM session cookies, it is highly recommended to secure access in **Web Station** by implementing an **IP Address Access Control List (ACL)**. This ensures that only trusted devices from the local network can access the application.

---

After successful configuration, the app is accessible at:
`http://your-nas-ip/graphstation/`
