# Deploying Uncle Jerry Blueprint Analyzer to DigitalOcean

This guide provides step-by-step instructions for deploying the Uncle Jerry Blueprint Analyzer application to a DigitalOcean droplet.

## Prerequisites

- A DigitalOcean account
- SSH access to your droplet
- Domain name (optional but recommended)
- Node.js (v16.x recommended) and npm installed on your droplet

## Step 1: Prepare Your Application

Before deploying, make sure your application is ready:

1. Set production environment variables:
   ```
   REACT_APP_API_URL=https://your-domain.com/api
   NODE_ENV=production
   ```

2. Build your React application locally:
   ```bash
   # Fix OpenSSL issue for Node 17+ by setting this environment variable
   export NODE_OPTIONS=--openssl-legacy-provider
   
   # Then build the app
   npm run build
   ```

3. The build folder will contain optimized static files for production.

## Step 2: Set Up Your DigitalOcean Droplet

1. Create a new Ubuntu droplet (recommended: Ubuntu 20.04)
2. Connect to your droplet via SSH:
   ```bash
   ssh root@your-droplet-ip
   ```

3. Update the system and install Node.js and Nginx:
   ```bash
   apt update && apt upgrade -y
   
   # Install Node.js 16.x
   curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
   apt install -y nodejs nginx
   
   # Verify installation
   node -v
   npm -v
   ```

## Step 3: Set Up Nginx as a Web Server and Reverse Proxy

1. Configure Nginx to serve the React application and proxy API requests:

   ```bash
   # Edit Nginx configuration
   nano /etc/nginx/sites-available/uncle-jerry
   ```

2. Add the following configuration:

   ```nginx
   server {
       listen 80;
       server_name your-domain.com www.your-domain.com;
       
       # React application
       location / {
           root /var/www/uncle-jerry;
           try_files $uri $uri/ /index.html;
           index index.html;
       }
       
       # API proxy
       location /api {
           proxy_pass http://localhost:3001;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

3. Create a symbolic link and test Nginx configuration:

   ```bash
   ln -s /etc/nginx/sites-available/uncle-jerry /etc/nginx/sites-enabled/
   nginx -t
   systemctl restart nginx
   ```

## Step 4: Deploy the Frontend

1. Create the deployment directory:

   ```bash
   mkdir -p /var/www/uncle-jerry
   ```

2. Transfer your build files to the droplet:

   ```bash
   # From your local machine
   scp -r build/* root@your-droplet-ip:/var/www/uncle-jerry/
   ```

## Step 5: Deploy the Backend API

1. Clone your backend repository on the droplet:

   ```bash
   cd /opt
   git clone https://github.com/your-username/uncle-jerry-blueprint-analyzer.git
   cd uncle-jerry-blueprint-analyzer/backend
   ```

2. Install dependencies and build:

   ```bash
   npm install
   npm run build # If applicable
   ```

3. Set up environment variables:

   ```bash
   nano .env
   ```
   
   Add necessary environment variables like:
   ```
   PORT=3001
   CLAUDE_API_KEY=your-api-key
   ```

4. Set up PM2 to manage your Node.js application:

   ```bash
   # Install PM2
   npm install -g pm2
   
   # Start the API server
   pm2 start npm --name "uncle-jerry-api" -- start
   
   # Ensure PM2 restarts the app if the droplet reboots
   pm2 startup
   pm2 save
   ```

## Step 6: Set Up SSL with Let's Encrypt (Optional but Recommended)

1. Install Certbot:

   ```bash
   apt install -y certbot python3-certbot-nginx
   ```

2. Obtain and install certificates:

   ```bash
   certbot --nginx -d your-domain.com -d www.your-domain.com
   ```

3. Certbot will automatically modify your Nginx configuration to use HTTPS.

## Step 7: Testing Your Deployment

1. Visit your domain or droplet IP in a web browser
2. Test the application functionality:
   - Upload blueprints
   - Get analysis results
   - Verify all features work correctly

## Troubleshooting

- Check Nginx logs: `tail -f /var/log/nginx/error.log`
- Check PM2 logs: `pm2 logs`
- Verify API server is running: `pm2 status`
- Check for proper permissions: `chown -R www-data:www-data /var/www/uncle-jerry`

## Additional Security Considerations

1. Set up a firewall:
   ```bash
   ufw allow OpenSSH
   ufw allow 'Nginx Full'
   ufw enable
   ```

2. Create a non-root user:
   ```bash
   adduser username
   usermod -aG sudo username
   ```

3. Configure SSH to use key authentication only:
   ```bash
   nano /etc/ssh/sshd_config
   # Set PasswordAuthentication no
   systemctl restart sshd
   ```

## Regular Maintenance

1. Keep your system updated:
   ```bash
   apt update && apt upgrade -y
   ```

2. Monitor resource usage:
   ```bash
   htop
   ```

3. Automate backups of your database and important files