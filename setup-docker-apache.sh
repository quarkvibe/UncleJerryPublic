#!/bin/bash

echo "Setting up Uncle Jerry Blueprint Analyzer with Docker and Apache..."

# Build the frontend
echo "Building frontend..."
cd /home/quarkvibe/uncle-jerry-blueprint-analyzer/frontend
npm install
npm run build

# Create a placeholder index.html if build fails
if [ ! -f "build/index.html" ]; then
  mkdir -p build
  echo "<html><body><h1>Uncle Jerry Blueprint Analyzer</h1><p>Frontend build is not available.</p></body></html>" > build/index.html
fi

# Start Docker containers
echo "Starting Docker containers..."
cd /home/quarkvibe/uncle-jerry-blueprint-analyzer
docker-compose -f docker-compose-apache.yml up -d

echo "Setup complete!"
echo "Access the application at http://localhost"
echo "Access MongoDB Express at http://localhost/mongo"

# Add to hosts file (requires sudo)
echo "To use a custom domain name, add this to /etc/hosts:"
echo "127.0.0.1 blueprint.local www.blueprint.local"