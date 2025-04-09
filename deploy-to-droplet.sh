#!/bin/bash
# Uncle Jerry Blueprint Analyzer - Deployment Script for Digital Ocean

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration - MODIFY THESE VALUES
DROPLET_IP="" # e.g., "123.456.789.012" - Will be prompted for
DROPLET_USER="root" # or your user with sudo privileges
REPO_URL="git@github.com:quarkvibe/UncleJerryBlueprintAnalyzer.git" # Your repository URL
DOMAIN="" # Optional, if you're using a domain

# Prompts
echo -e "${YELLOW}Uncle Jerry Blueprint Analyzer - Deployment Script${NC}"
echo -e "This script will deploy the application to your Digital Ocean droplet."
echo

# Prompt for configuration details if not set
if [ "$DROPLET_IP" == "your-droplet-ip" ]; then
  read -p "Enter your droplet IP address: " DROPLET_IP
fi

if [ "$DROPLET_USER" == "root" ]; then
  read -p "Enter the SSH user (default is root): " USER_INPUT
  if [ ! -z "$USER_INPUT" ]; then
    DROPLET_USER=$USER_INPUT
  fi
fi

echo -e "\n${YELLOW}Deployment Configuration:${NC}"
echo -e "Droplet IP: ${GREEN}$DROPLET_IP${NC}"
echo -e "SSH User: ${GREEN}$DROPLET_USER${NC}"
echo -e "Repository URL: ${GREEN}$REPO_URL${NC}"
if [ "$DOMAIN" != "your-domain.com" ]; then
  echo -e "Domain: ${GREEN}$DOMAIN${NC}"
fi

echo
read -p "Is this correct? (y/n): " CONFIRM
if [ "$CONFIRM" != "y" ] && [ "$CONFIRM" != "Y" ]; then
  echo -e "${RED}Deployment aborted.${NC}"
  exit 1
fi

# Option 1: Deploy using Git repository on the server
echo -e "\n${YELLOW}Choose deployment method:${NC}"
echo "1. Clone/pull from Git repository on the server (recommended)"
echo "2. Use rsync to copy files directly from local machine"
read -p "Enter your choice (1/2): " DEPLOY_METHOD

if [ "$DEPLOY_METHOD" == "1" ]; then
  # Deploy using Git
  echo -e "\n${YELLOW}Deploying using Git repository...${NC}"
  
  # Create deployment script for server
  cat > /tmp/uncle-jerry-deploy.sh << EOF
#!/bin/bash
# Server-side deployment script

# Install dependencies if not already installed
if ! command -v node &> /dev/null || ! command -v npm &> /dev/null; then
  echo "Installing Node.js and npm..."
  curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi

if ! command -v git &> /dev/null; then
  echo "Installing Git..."
  sudo apt-get update
  sudo apt-get install -y git
fi

# Install MongoDB if not already installed
if ! command -v mongod &> /dev/null; then
  echo "Installing MongoDB..."
  wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
  echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
  sudo apt-get update
  sudo apt-get install -y mongodb-org
  sudo systemctl start mongod
  sudo systemctl enable mongod
fi

# Install PM2 if not already installed
if ! command -v pm2 &> /dev/null; then
  echo "Installing PM2..."
  sudo npm install -g pm2
fi

# Install Apache if not already installed
if ! command -v apache2 &> /dev/null; then
  echo "Installing Apache..."
  sudo apt-get update
  sudo apt-get install -y apache2 apache2-utils
  sudo a2enmod proxy proxy_http rewrite
fi

# Create app directory if it doesn't exist
APP_DIR="/var/www/uncle-jerry"
if [ ! -d "\$APP_DIR" ]; then
  sudo mkdir -p "\$APP_DIR"
  sudo chown \$(whoami):\$(whoami) "\$APP_DIR"
fi

# Clone or pull repository
cd "\$APP_DIR"
if [ ! -d "\$APP_DIR/.git" ]; then
  echo "Cloning repository..."
  git clone $REPO_URL .
else
  echo "Updating repository..."
  git pull
fi

# Setup environment files
if [ ! -f "\$APP_DIR/backend/.env" ]; then
  echo "Creating backend .env file..."
  cp "\$APP_DIR/backend/.env.example" "\$APP_DIR/backend/.env"
  # Update .env file - you need to edit this manually with your values
  echo "Please update the backend/.env file with your specific configuration!"
fi

# Create uploads directory
mkdir -p "\$APP_DIR/backend/uploads"
chmod 755 "\$APP_DIR/backend/uploads"

# Install backend dependencies
cd "\$APP_DIR/backend"
npm install

# Build frontend
cd "\$APP_DIR/frontend"
npm install
npm run build

# Setup Apache configuration
if [ ! -f "/etc/apache2/sites-available/uncle-jerry.conf" ]; then
  echo "Setting up Apache virtual host..."
  sudo cp "\$APP_DIR/apache-config.conf" "/etc/apache2/sites-available/uncle-jerry.conf"
  
  # Update server name if domain provided
  if [ "$DOMAIN" != "your-domain.com" ]; then
    sudo sed -i "s/ServerName blueprint.local/ServerName $DOMAIN/" "/etc/apache2/sites-available/uncle-jerry.conf"
    sudo sed -i "s/ServerAlias www.blueprint.local/ServerAlias www.$DOMAIN/" "/etc/apache2/sites-available/uncle-jerry.conf"
  fi
  
  sudo a2ensite uncle-jerry.conf
  sudo systemctl reload apache2
fi

# Start backend with PM2
cd "\$APP_DIR/backend"
pm2 delete uncle-jerry-backend || true
pm2 start server.js --name "uncle-jerry-backend"
pm2 save

echo "Deployment completed successfully!"
EOF

  # Upload and execute the deployment script
  chmod +x /tmp/uncle-jerry-deploy.sh
  scp /tmp/uncle-jerry-deploy.sh $DROPLET_USER@$DROPLET_IP:/tmp/
  ssh $DROPLET_USER@$DROPLET_IP "chmod +x /tmp/uncle-jerry-deploy.sh && /tmp/uncle-jerry-deploy.sh"
  
  echo -e "\n${GREEN}Deployment process initiated on the server.${NC}"
  echo -e "${YELLOW}Please check the server output and complete any manual configuration steps required.${NC}"

elif [ "$DEPLOY_METHOD" == "2" ]; then
  # Deploy using rsync
  echo -e "\n${YELLOW}Deploying using direct file transfer (rsync)...${NC}"
  
  # Build frontend first
  cd /home/quarkvibe/uncle-jerry-blueprint-analyzer/frontend
  npm install
  npm run build
  
  # Create deploy directory if it doesn't exist
  ssh $DROPLET_USER@$DROPLET_IP "mkdir -p /var/www/uncle-jerry"
  
  # Sync files (excluding node_modules, git, etc.)
  rsync -avz --exclude 'node_modules' --exclude '.git' \
    --exclude 'frontend/node_modules' --exclude 'backend/node_modules' \
    /home/quarkvibe/uncle-jerry-blueprint-analyzer/ $DROPLET_USER@$DROPLET_IP:/var/www/uncle-jerry/
  
  # Execute setup script on the server
  ssh $DROPLET_USER@$DROPLET_IP "cd /var/www/uncle-jerry && chmod +x setup-docker-apache.sh && ./setup-docker-apache.sh"
  
  echo -e "\n${GREEN}Files transferred to the server.${NC}"
  echo -e "${YELLOW}Please complete setup by running the setup scripts on the server.${NC}"
else
  echo -e "${RED}Invalid option. Deployment aborted.${NC}"
  exit 1
fi

echo -e "\n${GREEN}Deployment process completed.${NC}"
echo -e "To access your application, go to http://$DROPLET_IP or http://$DOMAIN if you've configured DNS."
echo -e "${YELLOW}Don't forget to:${NC}"
echo "1. Configure your environment variables in the .env files"
echo "2. Set up SSL certificates for HTTPS (recommended for production)"
echo "3. Configure a proper firewall on your droplet"

exit 0