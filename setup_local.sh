#!/bin/bash

echo "--- Local Setup: GraphStation ---"

# 1. Handle .env file
if [ ! -f .env ]; then
    echo "Creating .env file from .env.template..."
    cp .env.template .env
    
    echo "Please enter your NAS configuration:"
    read -p "NAS Username: " nas_user
    read -p "NAS Host (IP or Domain): " nas_host
    read -p "NAS Web Path [/volume1/web/graphstation_frontend]: " nas_web_path
    nas_web_path=${nas_web_path:-/volume1/web/graphstation_frontend}
    
    # Update .env with sed (handling both macOS and Linux sed)
    sed -i.bak "s/NAS_USER=your-username/NAS_USER=$nas_user/" .env
    sed -i.bak "s/NAS_HOST=your-nas-ip-or-domain/NAS_HOST=$nas_host/" .env
    sed -i.bak "s|NAS_WEB_PATH=/volume1/web/graphstation|NAS_WEB_PATH=$nas_web_path|" .env
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
