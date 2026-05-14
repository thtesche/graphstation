#!/bin/bash

# Load environment variables from .env file
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
else
    echo ".env file not found!"
    exit 1
fi

echo "🚀 Starting deployment of GraphStation Frontend..."

# 1. Build the frontend
echo "📦 Building frontend..."
cd frontend
npm install
npm run build
cd ..

# 2. Check if build directory exists
if [ ! -d "frontend/dist" ]; then
    echo "❌ Build failed, frontend/dist directory not found!"
    exit 1
fi

# 3. Create tarball of the build
echo "🗜️ Creating tarball..."
tar -czf graphstation_frontend.tar.gz -C frontend/dist .

# 4. Upload and extract on NAS
echo "📤 Uploading and extracting on NAS ($NAS_HOST)..."
# Ensure the directory exists on NAS first, then extract the tarball
ssh "$NAS_USER@$NAS_HOST" "mkdir -p $NAS_WEB_PATH"
cat graphstation_frontend.tar.gz | ssh "$NAS_USER@$NAS_HOST" "tar -xzf - -C $NAS_WEB_PATH"

# 5. Cleanup
echo "🧹 Cleaning up local tarball..."
rm graphstation_frontend.tar.gz

echo "✅ Deployment finished successfully!"
echo "Your app should be available at http://$NAS_HOST/$(basename $NAS_WEB_PATH)/ (depending on your Web Station config)"
