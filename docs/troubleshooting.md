# Troubleshooting Guide

This guide provides solutions for common issues encountered during deployment and operation of GraphStation.

## 1. Authentication & Synology Integration

### Issue: Cannot log in / "Unauthorized" errors

- **Check `SYNOLOGY_URL`:** Ensure this is correct in your `.env` file (e.g., `http://192.168.0.10:5000`). It must include the protocol and port.
- **DSM Session Cookies:** GraphStation relies on the `sid` cookie from Synology. If you are using a reverse proxy or different domains, ensure that cookies are being passed correctly between the frontend and backend.
- **IP Access Control:** If you have implemented IP ACLs in Synology Web Station, ensure your client device is allowed to access both the frontend and backend aliases.

### Issue: `DEFAULT_OWNER` is used instead of logged-in user

- This happens when the backend cannot find a valid session in the `session_cache.json` or via the `sid` cookie.
- Verify that your browser is actually sending the `sid` cookie with requests to the backend API.

---

## 2. Database (Memgraph) Issues

### Issue: "Database driver not initialized"

- **Check Memgraph Connectivity:** Ensure the Memgraph container/service is running and reachable from the backend.
- **Verify Credentials:** Check `MEMGRAPH_HOST`, `MEMGRAPH_PORT`, `MEMGRAPH_USER`, and `MEMGRAPH_PASSWORD` in your `.env`.
- **Network Access:** If using Docker, ensure the backend can reach the Memgraph container (e.g., they are on the same Docker network).

### Issue: Empty results or missing data

- **Sync Status:** Ensure that `synofoto-graph-sync` has been run successfully and that the graph is populated with data.
- **Cypher Queries:** You can use Memgraph Lab to manually run queries (see [Development Guide](docs/development.md#4-working-with-the-graph-memgraph)) to verify if the data exists in the expected format.

---

## 3. Deployment & Web Station

### Issue: Frontend or Backend not accessible via Alias

- **Web Station Configuration:** Double-check that you have created both the **Service** and the **Web Portal (Alias)** in Synology Web Station.
- **Alias Names:** Remember that Synology does not allow slashes in alias names. Use `graphstation` and `graphstation-api`.
- **Document Root:** Ensure the Document Root for your services points to the correct folder where the files were deployed by `./deploy.sh`.

### Issue: Python dependencies missing on NAS

- If you see `ModuleNotFoundError`, you must manually install the requirements via SSH as described in [Deployment Guide (NAS)](docs/deployment.md#5-installing-backend-dependencies).

---

## 4. Docker Deployment

### Issue: Containers fail to start

- **Check Logs:** Use `docker logs <container_name>` to see why a container is crashing.
  - For API: `docker logs graphstation-api`
  - For Frontend: `docker logs graphstation-frontend`
- **Port Conflicts:** Ensure that ports `7687`, `3000`, `5000`, and `80` are not already in use on the target machine.

### Issue: Data not persisting

- Ensure that the `data/` folder is correctly mapped as a volume in your `docker-compose.yml`.

---

## 5. General Tips

- **Logs are your friend:** Always check both the backend logs (Flask/Gunicorn) and the frontend logs (Nginx) to diagnose issues.
- **Environment Variables:** A common source of error is a typo in the `.env` file. Double-check all variable names and values.
