# SSL Configuration for Uncle Jerry Blueprint Analyzer

This guide explains how to configure SSL for both the development environment and production deployment on DigitalOcean.

## SSL Configuration for Production

When deploying to your DigitalOcean droplet, you'll want to configure SSL to ensure secure connections. Here's how to set it up:

### 1. Configure SSL with Let's Encrypt

Let's Encrypt provides free SSL certificates that are trusted by most browsers. Here's how to set it up with Nginx:

1. Install Certbot and the Nginx plugin:
   ```bash
   apt update
   apt install -y certbot python3-certbot-nginx
   ```

2. Obtain and install SSL certificates:
   ```bash
   certbot --nginx -d your-domain.com -d www.your-domain.com
   ```

3. Follow the prompts to complete the certificate installation.

4. Certbot will automatically modify your Nginx configuration to use HTTPS.

5. Test the automatic renewal:
   ```bash
   certbot renew --dry-run
   ```

### 2. Configure SSL in Nginx Manually (Alternative Method)

If you prefer to configure SSL manually or can't use Certbot, follow these steps:

1. Place your SSL certificate and key in the appropriate directory:
   ```bash
   sudo mkdir -p /etc/nginx/ssl
   sudo cp your-domain.crt /etc/nginx/ssl/
   sudo cp your-domain.key /etc/nginx/ssl/
   ```

2. Update your Nginx configuration:
   ```nginx
   server {
       listen 80;
       server_name your-domain.com www.your-domain.com;
       return 301 https://$host$request_uri;
   }

   server {
       listen 443 ssl;
       server_name your-domain.com www.your-domain.com;
       
       ssl_certificate /etc/nginx/ssl/your-domain.crt;
       ssl_certificate_key /etc/nginx/ssl/your-domain.key;
       
       # SSL configuration
       ssl_protocols TLSv1.2 TLSv1.3;
       ssl_prefer_server_ciphers on;
       ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384;
       ssl_session_cache shared:SSL:10m;
       ssl_session_timeout 1d;
       
       # HSTS (optional but recommended)
       add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
       
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

3. Test and restart Nginx:
   ```bash
   nginx -t
   systemctl restart nginx
   ```

## Fixing the Node.js OpenSSL Issue

The error you encountered when building the application is related to Node.js 17+ using a newer OpenSSL implementation that's incompatible with the build tools. Here's how we fixed it:

### 1. Updated package.json Scripts

We've modified the `package.json` scripts to automatically set the OpenSSL legacy provider:

```json
"scripts": {
  "start": "react-scripts start",
  "build": "export NODE_OPTIONS=--openssl-legacy-provider && react-scripts build",
  "build:windows": "set NODE_OPTIONS=--openssl-legacy-provider && react-scripts build",
  "test": "react-scripts test",
  "eject": "react-scripts eject"
}
```

Now when you run `npm run build`, it will automatically use the legacy OpenSSL provider.

### 2. Alternative Solutions

If you continue to have issues with the build process, consider these alternatives:

1. Downgrade to Node.js 16.x:
   ```bash
   # Using nvm (Node Version Manager)
   nvm install 16
   nvm use 16
   
   # Or install directly
   curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
   sudo apt install -y nodejs
   ```

2. Set the environment variable system-wide:
   ```bash
   # For Linux/macOS (add to .bashrc or .zshrc)
   echo 'export NODE_OPTIONS=--openssl-legacy-provider' >> ~/.bashrc
   source ~/.bashrc
   
   # For Windows (in PowerShell, run as administrator)
   [Environment]::SetEnvironmentVariable("NODE_OPTIONS", "--openssl-legacy-provider", "Machine")
   ```

## Configuring SSL for Development (Optional)

For local development with HTTPS:

1. Generate a self-signed certificate:
   ```bash
   openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout ./dev-cert.key -out ./dev-cert.pem
   ```

2. Create a `.env.development.local` file with:
   ```
   HTTPS=true
   SSL_CRT_FILE=./dev-cert.pem
   SSL_KEY_FILE=./dev-cert.key
   ```

3. Start the development server:
   ```bash
   npm start
   ```

4. Your browser will show a security warning since it's a self-signed certificate. You can proceed after accepting the risk.

## Additional Security Considerations

1. Configure Content Security Policy (CSP):
   ```nginx
   add_header Content-Security-Policy "default-src 'self'; script-src 'self'; connect-src 'self' https://api.example.com; img-src 'self' data:; style-src 'self' 'unsafe-inline'; font-src 'self';" always;
   ```

2. Enable HTTP/2 for better performance:
   ```nginx
   listen 443 ssl http2;
   ```

3. Configure secure cookies in your backend:
   ```javascript
   app.use(session({
     cookie: {
       secure: true,
       httpOnly: true,
       sameSite: 'strict'
     }
   }));
   ```

## Troubleshooting SSL Issues

1. **Certificate Renewal Failures**:
   ```bash
   systemctl status certbot.timer
   certbot renew --force-renewal
   ```

2. **SSL Handshake Errors**:
   ```bash
   openssl s_client -connect your-domain.com:443 -tls1_2
   ```

3. **Performance Issues**:
   - Enable SSL session caching
   - Consider using OCSP stapling
   - Optimize cipher suites

For any other SSL-related issues, consult the Let's Encrypt documentation or Nginx SSL documentation.