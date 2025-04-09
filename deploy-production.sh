#!/bin/bash

echo "Deploying Uncle Jerry Blueprint Analyzer to production..."

# Check if running as root
if [ "$EUID" -ne 0 ]; then
  echo "Please run as root or with sudo"
  exit 1
fi

# Install required packages
echo "Installing required packages..."
apt update
apt install -y docker.io docker-compose certbot python3-certbot-apache

# Ensure Docker is running
systemctl start docker
systemctl enable docker

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

# Set up SSL certificates with Let's Encrypt
echo "Setting up SSL certificates for unclejerry.ai..."
certbot certonly --standalone -d unclejerry.ai -d www.unclejerry.ai --agree-tos --email admin@unclejerry.ai

# Copy certificates to Apache SSL directory
mkdir -p /home/quarkvibe/uncle-jerry-blueprint-analyzer/apache/ssl
cp /etc/letsencrypt/live/unclejerry.ai/fullchain.pem /home/quarkvibe/uncle-jerry-blueprint-analyzer/apache/ssl/
cp /etc/letsencrypt/live/unclejerry.ai/privkey.pem /home/quarkvibe/uncle-jerry-blueprint-analyzer/apache/ssl/

# Create HTTPS VirtualHost configuration
cat > /home/quarkvibe/uncle-jerry-blueprint-analyzer/apache/vhosts.conf << EOF
# HTTP - Redirect to HTTPS
<VirtualHost *:80>
    ServerName unclejerry.ai
    ServerAlias www.unclejerry.ai
    Redirect permanent / https://unclejerry.ai/
</VirtualHost>

# HTTPS
<VirtualHost *:443>
    ServerName unclejerry.ai
    ServerAlias www.unclejerry.ai
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

# Enable SSL module in Apache config
sed -i 's/#LoadModule ssl_module modules\/mod_ssl.so/LoadModule ssl_module modules\/mod_ssl.so/' /home/quarkvibe/uncle-jerry-blueprint-analyzer/apache/httpd.conf

# Start Docker containers
echo "Starting Docker containers..."
cd /home/quarkvibe/uncle-jerry-blueprint-analyzer
docker-compose -f docker-compose-apache.yml up -d

# Set up auto-renewal for SSL certificates
echo "Setting up SSL certificate auto-renewal..."
(crontab -l 2>/dev/null; echo "0 3 * * * certbot renew --quiet && docker restart uncle-jerry-apache") | crontab -

echo "Deployment complete!"
echo "Access the application at https://unclejerry.ai"
echo "Access MongoDB Express at https://unclejerry.ai/mongo"