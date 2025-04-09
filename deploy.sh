#!/bin/bash

echo "Deploying Uncle Jerry Blueprint Analyzer to DigitalOcean droplet..."

# Check for environment variables
if [ -z "$ANTHROPIC_API_KEY" ]; then
  echo "Error: ANTHROPIC_API_KEY environment variable is not set"
  echo "Please set it with: export ANTHROPIC_API_KEY=your_api_key"
  exit 1
fi

# Install Docker and dependencies if not already installed
if ! command -v docker &> /dev/null; then
  echo "Installing Docker..."
  apt update
  apt install -y docker.io docker-compose
  systemctl start docker
  systemctl enable docker
fi

# Install certbot for SSL
if ! command -v certbot &> /dev/null; then
  echo "Installing Certbot..."
  apt install -y certbot python3-certbot-apache
fi

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

# Prompt for domain name
read -p "Enter your domain name (e.g., unclejerry.ai): " DOMAIN_NAME
if [ -z "$DOMAIN_NAME" ]; then
  DOMAIN_NAME="unclejerry.ai"
  echo "Using default domain: $DOMAIN_NAME"
fi

# Prompt if we should obtain SSL certificates
read -p "Obtain SSL certificates for $DOMAIN_NAME? (y/n): " GET_SSL
if [ "$GET_SSL" = "y" ]; then
  echo "Setting up SSL certificates for $DOMAIN_NAME..."
  
  # Stop Apache if running (to free port 80)
  docker-compose -f docker-compose-apache.yml down
  
  # Obtain certificates
  certbot certonly --standalone -d $DOMAIN_NAME -d www.$DOMAIN_NAME --agree-tos --email admin@$DOMAIN_NAME
  
  # Copy certificates to Apache SSL directory
  mkdir -p /home/quarkvibe/uncle-jerry-blueprint-analyzer/apache/ssl
  cp /etc/letsencrypt/live/$DOMAIN_NAME/fullchain.pem /home/quarkvibe/uncle-jerry-blueprint-analyzer/apache/ssl/
  cp /etc/letsencrypt/live/$DOMAIN_NAME/privkey.pem /home/quarkvibe/uncle-jerry-blueprint-analyzer/apache/ssl/
  
  # Set up auto-renewal
  (crontab -l 2>/dev/null; echo "0 3 * * * certbot renew --quiet && docker restart uncle-jerry-apache") | crontab -
  
  echo "SSL certificates installed successfully!"
else
  echo "Skipping SSL setup. Using HTTP only."
fi

# Make sure Apache SSL module is enabled
sed -i 's/#LoadModule ssl_module modules\/mod_ssl.so/LoadModule ssl_module modules\/mod_ssl.so/' /home/quarkvibe/uncle-jerry-blueprint-analyzer/apache/httpd.conf

# Configure vhosts.conf based on whether SSL is enabled
if [ "$GET_SSL" = "y" ]; then
  cat > /home/quarkvibe/uncle-jerry-blueprint-analyzer/apache/vhosts.conf << EOF
# HTTP - Redirect to HTTPS
<VirtualHost *:80>
    ServerName $DOMAIN_NAME
    ServerAlias www.$DOMAIN_NAME
    Redirect permanent / https://$DOMAIN_NAME/
</VirtualHost>

# HTTPS
<VirtualHost *:443>
    ServerName $DOMAIN_NAME
    ServerAlias www.$DOMAIN_NAME
    DocumentRoot /usr/local/apache2/htdocs
    
    SSLEngine on
    SSLCertificateFile /usr/local/apache2/ssl/fullchain.pem
    SSLCertificateKeyFile /usr/local/apache2/ssl/privkey.pem
    
    <Directory "/usr/local/apache2/htdocs">
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted
        
        # For SPA routing
        RewriteEngine On
        RewriteBase /
        RewriteRule ^index\.html$ - [L]
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule . /index.html [L]
    </Directory>
    
    # Proxy for backend API
    ProxyPass /api http://backend:3001/api
    ProxyPassReverse /api http://backend:3001/api
    
    # MongoDB Express UI
    ProxyPass /mongo http://mongo-express:8081
    ProxyPassReverse /mongo http://mongo-express:8081
    
    ErrorLog /usr/local/apache2/logs/blueprint-error.log
    CustomLog /usr/local/apache2/logs/blueprint-access.log combined
</VirtualHost>
EOF
else
  cat > /home/quarkvibe/uncle-jerry-blueprint-analyzer/apache/vhosts.conf << EOF
<VirtualHost *:80>
    ServerName $DOMAIN_NAME
    ServerAlias www.$DOMAIN_NAME
    DocumentRoot /usr/local/apache2/htdocs
    
    <Directory "/usr/local/apache2/htdocs">
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted
        
        # For SPA routing
        RewriteEngine On
        RewriteBase /
        RewriteRule ^index\.html$ - [L]
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule . /index.html [L]
    </Directory>
    
    # Proxy for backend API
    ProxyPass /api http://backend:3001/api
    ProxyPassReverse /api http://backend:3001/api
    
    # MongoDB Express UI
    ProxyPass /mongo http://mongo-express:8081
    ProxyPassReverse /mongo http://mongo-express:8081
    
    ErrorLog /usr/local/apache2/logs/blueprint-error.log
    CustomLog /usr/local/apache2/logs/blueprint-access.log combined
</VirtualHost>
EOF
fi

# Open required ports in firewall
echo "Configuring firewall..."
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS

# Start Docker containers
echo "Starting Docker containers..."
cd /home/quarkvibe/uncle-jerry-blueprint-analyzer
docker-compose -f docker-compose-apache.yml up -d

echo "Deployment complete!"
if [ "$GET_SSL" = "y" ]; then
  echo "Access the application at https://$DOMAIN_NAME"
  echo "Access MongoDB Express at https://$DOMAIN_NAME/mongo"
else
  echo "Access the application at http://$DOMAIN_NAME"
  echo "Access MongoDB Express at http://$DOMAIN_NAME/mongo"
fi