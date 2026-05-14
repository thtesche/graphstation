# Synology Deployment & Web Station Setup

This guide explains how to configure your Synology NAS for GraphStation and how to use the automated deployment script.

## 2. Web Station Configuration

### Frontend (Static Website)
... (existing steps) ...

### Backend (Python Service)
To run the Python API, you need to configure a Python Script Language Service:

1. Open **Web Station** > **Script Language Service**.
2. Click **Create** and select **Python**.
3. **Name:** `graphstation-backend`
4. **Python Version:** Select **Python 3.9**.
5. Click **Next** and **Create**.

### Web Portals
You need two portals (or one with an alias):

1. **Frontend Portal:** 
   - Service: `graphstation-frontend`
   - Alias: `graphstation` (Access via `http://nas-ip/graphstation`)
2. **Backend Portal:**
   - Service: `graphstation-backend`
   - Alias: `graphstation/api`
   - **IMPORTANT:** Set the **Document root** for this service to the `/api` subfolder where the backend files are located.

## 3. Environment Configuration

Edit your local `.env` file to include Memgraph details:

```bash
# Memgraph Configuration
MEMGRAPH_HOST=your-nas-ip
MEMGRAPH_PORT=7687
MEMGRAPH_USER=
MEMGRAPH_PASSWORD=
```

## 4. Deployment

### Deploy Frontend
```bash
./deploy.sh
```

### Deploy Backend
```bash
./deploy_backend.sh
```
This script uploads the `backend/` content to the `/api` subfolder of your NAS web path.

## 5. Backend Requirements Installation

After the first backend deployment, you must install the Python dependencies on the NAS:

1. SSH into your NAS.
2. Navigate to the backend folder:
   ```bash
   cd /volume1/web/graphstation_frontend/api
   ```
3. Install requirements (assuming `pip` is available for Python 3.9):
   ```bash
   python3 -m pip install -r requirements.txt
   ```
   *Alternatively, use the Web Station UI to manage packages for the Python service.*

After deployment, open your browser and navigate to:
`http://your-nas-ip/graphstation/` (or your configured alias).

You should see the "GraphStation Hello World" page.
