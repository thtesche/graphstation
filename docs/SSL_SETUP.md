# SSL Certificate Setup with mkcert

This documentation describes how to create and configure local SSL certificates for development and deployment on the NAS (using `mkcert`).

## Prerequisites

- [mkcert](https://github.com/FiloSottile/mkcert) is installed on the host system.
- The local CA has been registered once with `mkcert -install`.

## Step 1: Generate Certificate

Navigate to the directory where you want to manage the certificates. Generate the certificate for your hostname (replace `your-domain` with your actual hostname, e.g., `atlantis`).

```bash
# 1. Generate certificate and private key for the hostname
mkcert your-domain
```

This creates two files in the current directory:
- `your-domain.pem` (The public certificate)
- `your-domain-key.pem` (The private key)

## Step 2: Prepare Files for Nginx

The Nginx configuration in the Docker container expects the certificates in a specific directory. According to the `docker-compose.yml`, the target directory on the host is: `./frontend/certs`.

We need to rename the files (if different names are defined in `nginx.conf`) and move them to the target directory.

```bash
# 1. Create target directory on host (if not present)
mkdir -p frontend/certs

# 2. Rename files and copy to the target directory
# If your nginx.conf expects e.g. 'your-domain.pem':
cp your-domain.pem frontend/certs/your-domain.pem
cp your-domain-key.pem frontend/certs/your-domain-key.pem

# 3. Ensure permissions are correct
chmod 644 frontend/certs/your-domain.pem
chmod 600 frontend/certs/your-domain-key.pem
```

## Step 3: Restart Docker Container

To ensure Nginx recognizes the new files in the mapped volume, the container must be recreated.

```bash
# Stop the Nginx container, reload configuration and start
docker-compose up -d --force-recreate nginx
```

## Troubleshooting

| Symptom | Cause | Solution |
| :--- | :--- | :--- |
| `BIO_new_file() failed` (Nginx Log) | File not found or wrong path. | Check the mapping in `docker-compose.yml` and the filename in `nginx.conf`. |
| `Permission denied` (Nginx Log) | File belongs to `root` or has too restrictive permissions. | Run `sudo chown -R $USER:$USER frontend/certs`. |
| Browser shows "Insecure Connection" | CA not installed in the browser. | Run `mkcert -install` on the client machine. |
