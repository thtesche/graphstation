#!/bin/bash

echo "--- Local Setup: GraphStation ---"

# 1. Handle .env file
if [ ! -f .env ]; then
    echo "Creating .env file from .env.template..."
    cp .env.template .env
    
    echo "Please enter your NAS configuration:"
    read -p "NAS Username: " nas_user
    read -p "NAS Host (IP or Domain): " nas_host
    read -p "Frontend Path [/volume1/web/graphstation_frontend]: " frontend_path
    frontend_path=${frontend_path:-/volume1/web/graphstation_frontend}
    read -p "Backend Path [$frontend_path/api]: " backend_path
    backend_path=${backend_path:-$frontend_path/api}
    
    # Update .env with sed (handling both macOS and Linux sed)
    sed -i.bak "s/GRAPHSTATION_USER=your-username/GRAPHSTATION_USER=$nas_user/" .env
    sed -i.bak "s/GRAPHSTATION_HOST=your-nas-ip-or-domain/GRAPHSTATION_HOST=$nas_host/" .env
    sed -i.bak "s|GRAPHSTATION_FRONTEND_PATH=/volume1/web/graphstation_frontend|GRAPHSTATION_FRONTEND_PATH=$frontend_path|" .env
    sed -i.bak "s|GRAPHSTATION_BACKEND_PATH=/volume1/web/graphstation_frontend/api|GRAPHSTATION_BACKEND_PATH=$backend_path|" .env
    rm .env.bak
    
    echo ".env file created and configured."
else
    echo ".env file already exists."
fi

# 2. Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd frontend
npm install
cd ..

# 3. Make scripts executable
chmod +x deploy.sh

echo ""
echo "--- Setup complete ---"
echo "You can now run './deploy.sh' to build and upload the frontend to your NAS."
