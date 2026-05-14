#!/bin/bash

# Load environment variables from .env file
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
else
    echo ".env file not found!"
    exit 1
fi

# Configuration
NAS_BACKEND_PATH="$NAS_WEB_PATH/api" # Often apps are split into frontend and api on Synology

echo "🚀 Starting deployment of GraphStation Backend..."

# 1. Create tarball of the backend
echo "🗜️ Creating tarball..."
COPYFILE_DISABLE=1 tar -czf graphstation_backend.tar.gz -C backend .

# 2. Upload and extract on NAS
echo "📤 Uploading and extracting on NAS ($NAS_HOST)..."
ssh "$NAS_USER@$NAS_HOST" "mkdir -p $NAS_BACKEND_PATH"
cat graphstation_backend.tar.gz | ssh "$NAS_USER@$NAS_HOST" "tar -xzf - --no-same-owner --no-same-permissions -C $NAS_BACKEND_PATH"

# 3. Cleanup local tarball
rm graphstation_backend.tar.gz

echo "✅ Backend files uploaded to $NAS_BACKEND_PATH"
echo ""
echo "📝 Note for Synology Web Station:"
echo "1. Go to Web Station > Web Service > Create > Script Language Service > Python."
echo "2. Select Python 3.9 and set the document root to $NAS_BACKEND_PATH."
echo "3. Create a Web Portal (Alias or Port) for this service."
echo "4. IMPORTANT: Ensure 'pip install -r requirements.txt' is run on the NAS if needed,"
echo "   or use the Web Station UI to manage dependencies."
