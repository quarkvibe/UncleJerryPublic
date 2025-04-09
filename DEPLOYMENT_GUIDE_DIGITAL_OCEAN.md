# Uncle Jerry Blueprint Analyzer - DigitalOcean Deployment Guide

This guide will walk you through the process of deploying the Uncle Jerry Blueprint Analyzer application on a DigitalOcean Droplet.

## Prerequisites

1. A DigitalOcean account
2. SSH access to your droplet
3. Your GitHub repository with the application code
4. Anthropic API key for Claude integration

## Deployment Options

There are two ways to deploy the application:

1. **Git-based deployment (Recommended)**: Clone the repository directly on the server
2. **Direct file transfer**: Use rsync to copy files from your local machine

## Step 1: Prepare Your Droplet

If you haven't already created a droplet, create one with these specifications:

- **Distribution**: Ubuntu 20.04 or newer
- **Plan**: Basic
- **CPU**: At least 2GB RAM / 1 CPU
- **Authentication**: SSH keys (recommended)

## Step 2: Set Up SSH Access

Make sure you have SSH access to your droplet. If you're using SSH keys, you should be able to connect with:

```bash
ssh root@your-droplet-ip
```

## Step 3: Configure GitHub SSH Keys (For Git-based deployment)

If using the Git-based deployment method, make sure your droplet has SSH access to your GitHub repository:

1. On your droplet, generate an SSH key:
   ```bash
   ssh-keygen -t rsa -b 4096 -C "your_email@example.com"
   ```

2. Add the public key to your GitHub account:
   ```bash
   cat ~/.ssh/id_rsa.pub
   ```
   Copy the output and add it to your GitHub account's SSH keys in settings.

3. Test the connection:
   ```bash
   ssh -T git@github.com
   ```

## Step 4: Run the Deployment Script

The easiest way to deploy is to use the included `deploy-to-droplet.sh` script:

1. Make the script executable if it isn't already:
   ```bash
   chmod +x deploy-to-droplet.sh
   ```

2. Run the script:
   ```bash
   ./deploy-to-droplet.sh
   ```

3. Follow the prompts to enter your droplet's IP address and confirm deployment options.

## Step 5: Configure Environment Variables

After deployment, you'll need to configure your environment variables:

1. SSH into your droplet
2. Edit the backend .env file:
   ```bash
   nano /var/www/uncle-jerry/backend/.env
   ```

3. Update the following variables at minimum:
   - `ANTHROPIC_API_KEY`: Your Claude API key
   - `JWT_SECRET`: A secure random string for JWT token generation
   - `MONGODB_URI`: The MongoDB connection string (if using a different MongoDB instance)
   - `CORS_ORIGIN`: Your frontend URL (if different from localhost)

4. Save and exit the editor

## Step 6: Set Up Domain Name (Optional)

If you want to use a domain name:

1. Add an A record in your domain's DNS settings pointing to your droplet's IP address
2. Update the Apache configuration:
   ```bash
   sudo nano /etc/apache2/sites-available/uncle-jerry.conf
   ```

3. Replace `ServerName blueprint.local` with your domain name
4. Reload Apache:
   ```bash
   sudo systemctl reload apache2
   ```

## Step 7: Set Up SSL (Recommended for Production)

For HTTPS, use Let's Encrypt:

1. Install Certbot:
   ```bash
   sudo apt-get update
   sudo apt-get install certbot python3-certbot-apache
   ```

2. Run Certbot:
   ```bash
   sudo certbot --apache -d yourdomain.com -d www.yourdomain.com
   ```

3. Follow the prompts to complete the SSL setup

## Step 8: Verify Deployment

1. Restart the backend service:
   ```bash
   cd /var/www/uncle-jerry/backend
   pm2 restart uncle-jerry-backend
   ```

2. Check that Apache is running:
   ```bash
   sudo systemctl status apache2
   ```

3. Visit your domain or IP address in a browser to access the application

## Troubleshooting

If you encounter issues:

1. Check Apache error logs:
   ```bash
   sudo tail -f /var/log/apache2/error.log
   ```

2. Check the backend application logs:
   ```bash
   pm2 logs uncle-jerry-backend
   ```

3. Verify MongoDB is running:
   ```bash
   sudo systemctl status mongod
   ```

4. Check firewall settings:
   ```bash
   sudo ufw status
   ```
   Make sure ports 80 (HTTP) and 443 (HTTPS) are open

## Maintenance

- To update the application, run the deployment script again
- To restart the backend service:
  ```bash
  pm2 restart uncle-jerry-backend
  ```
- Monitor your application with:
  ```bash
  pm2 monit
  ```

## Security Considerations

- Consider setting up a firewall with `ufw`
- Use strong passwords for all services
- Keep your server updated with `apt update` and `apt upgrade`
- Consider disabling root SSH access
- Implement rate limiting for API endpoints