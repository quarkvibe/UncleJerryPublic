#!/bin/bash

echo "Setting up development environment for Uncle Jerry Blueprint Analyzer..."

# Start MongoDB with Docker
echo "Starting MongoDB..."
cd /home/quarkvibe/uncle-jerry-blueprint-analyzer
docker-compose up -d mongodb mongo-express

# Install backend dependencies
echo "Setting up backend..."
cd /home/quarkvibe/uncle-jerry-blueprint-analyzer/backend
npm install

# Install frontend dependencies
echo "Setting up frontend..."
cd /home/quarkvibe/uncle-jerry-blueprint-analyzer/frontend
npm install

echo "Development setup complete!"
echo "To start the backend: cd backend && npm start"
echo "To start the frontend: cd frontend && npm start"
echo "MongoDB is available at localhost:27017"
echo "MongoDB Express UI is available at http://localhost:8081"