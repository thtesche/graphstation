# Synology Deployment & Web Station Setup

This guide explains how to configure your Synology NAS for GraphStation and how to use the automated deployment script.

## 1. Web Station Configuration

To host the GraphStation frontend, you need to set up a "Web Service" in Synology Web Station.

### Frontend (Static Website)

1. Open **Web Station** on your DSM.
2. Go to **Web Service** and click **Create**.
3. Choose **Static Website**.
4. **Name:** `graphstation-frontend`
5. **Document root:** Select or create a folder (e.g., `/web/graphstation_frontend`).
6. Click **Next** and **Create**.

### Web Portal (Accessing the App)

1. Go to **Web Portal** and click **Create**.
2. Select **Web Service Portal**.
3. Choose the `graphstation-frontend` service.
4. **Portal type:**
   - **Name-based:** If you have a specific domain (e.g., `photos.yournas.com`).
   - **Alias-based:** (Recommended) Use an alias like `graphstation`.
5. Click **Create**.

## 2. Security & Authentication

While the static frontend is accessible via the Web Portal, actual data security is handled by the **Python Backend**.

- **Access Control:** You can optionally restrict access to your local network using a "Zugangskontrollprofil" (Systemsteuerung > Anmeldeportal > Erweitert) to limit access to specific IP ranges.
- **User Identity:** The backend will be responsible for identifying the DSM user (via Synology session cookies or headers) to ensure users only see their own photos.

## 3. Local Environment Setup

Before deploying, prepare your local environment:

1. **Environment Variables:**
   Copy the template and fill in your NAS details:

   ```bash
   cp .env.template .env
   ```

   Edit `.env`:
   - `NAS_HOST`: Your NAS IP or local DNS name.
   - `NAS_USER`: Your DSM username (must have SSH permissions).
   - `NAS_WEB_PATH`: The absolute path to your document root (e.g., `/volume1/web/graphstation_frontend`).

2. **SSH Key-Based Authentication (Highly Recommended):**
   To avoid typing your password every time, copy your SSH key to the NAS:

   ```bash
   ssh-copy-id your-user@your-nas-ip
   ```

## 4. Deployment

Run the included deployment script from the project root:

```bash
./deploy.sh
```

### What the script does

1. Builds the React frontend (`npm run build`).
2. Creates a compressed tarball of the `dist` folder.
3. Uploads the tarball to the NAS via SSH.
4. Extracts the files into the configured `NAS_WEB_PATH`.
5. Cleans up local temporary files.

## 5. Verification

After deployment, open your browser and navigate to:
`http://your-nas-ip/graphstation/` (or your configured alias).

You should see the "GraphStation Hello World" page.
