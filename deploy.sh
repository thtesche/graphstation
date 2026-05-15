#!/bin/bash

# Load environment variables from .env file
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
else
    echo ".env file not found!"
    exit 1
fi

# Configuration
NAS_BACKEND_PATH="$NAS_WEB_PATH/api"
MODE=${1:-all}

# Helper to upload .env
upload_env() {
    echo "🔑 Uploading .env file..."
    cat .env | ssh "$NAS_USER@$NAS_HOST" "cat > $NAS_BACKEND_PATH/.env"
}

deploy_frontend() {
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
        return 1
    fi

    # 3. Create and upload tarball
    echo "🗜️ Creating tarball..."
    COPYFILE_DISABLE=1 tar -czf graphstation_frontend.tar.gz -C frontend/dist .
    
    echo "📤 Uploading and extracting on NAS ($NAS_HOST)..."
    ssh "$NAS_USER@$NAS_HOST" "mkdir -p $NAS_WEB_PATH"
    cat graphstation_frontend.tar.gz | ssh "$NAS_USER@$NAS_HOST" "tar -xzf - --no-same-owner --no-same-permissions -C $NAS_WEB_PATH"
    
    rm graphstation_frontend.tar.gz
    echo "✅ Frontend deployment finished!"
}

deploy_backend() {
    echo "🚀 Starting deployment of GraphStation Backend..."

    # 1. Create and upload tarball
    echo "🗜️ Creating tarball..."
    COPYFILE_DISABLE=1 tar -czf graphstation_backend.tar.gz -C backend .

    echo "📤 Uploading and extracting on NAS ($NAS_HOST)..."
    ssh "$NAS_USER@$NAS_HOST" "mkdir -p $NAS_BACKEND_PATH"
    cat graphstation_backend.tar.gz | ssh "$NAS_USER@$NAS_HOST" "tar -xzf - --no-same-owner --no-same-permissions -C $NAS_BACKEND_PATH"

    rm graphstation_backend.tar.gz
    echo "✅ Backend deployment finished!"
}

case $MODE in
    frontend)
        upload_env
        deploy_frontend
        ;;
    backend)
        upload_env
        deploy_backend
        ;;
    all)
        upload_env
        deploy_frontend
        deploy_backend
        ;;
    *)
        echo "Usage: $0 [frontend|backend|all]"
        exit 1
        ;;
esac

echo ""
echo "🎉 All requested deployments finished successfully!"
