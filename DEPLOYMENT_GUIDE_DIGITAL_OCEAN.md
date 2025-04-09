# Deployment Guide for Uncle Jerry Blueprint Analyzer on DigitalOcean

This guide provides step-by-step instructions for deploying the Uncle Jerry Blueprint Analyzer application on a DigitalOcean Droplet.

## Prerequisites

1. A DigitalOcean account
2. A domain name that you can point to your DigitalOcean Droplet
3. An Anthropic API key for Claude

## Step 1: Create a DigitalOcean Droplet

1. Log in to your DigitalOcean account
2. Click "Create" > "Droplets"
3. Choose an image: Ubuntu 22.04 LTS
4. Choose a plan: Basic (at least 2GB RAM recommended)
5. Choose a datacenter region close to your target users
6. Add your SSH key or create a password
7. Click "Create Droplet"

## Step 2: Configure DNS

1. In the DigitalOcean control panel, go to "Networking" > "Domains"
2. Add your domain name
3. Create an A record pointing your domain (e.g., unclejerry.ai) to your Droplet's IP address
4. Create another A record for www subdomain (e.g., www.unclejerry.ai) pointing to the same IP

## Step 3: Connect to Your Droplet

```bash
ssh root@your-droplet-ip
```

## Step 4: Clone the Repository

```bash
git clone https://github.com/your-username/uncle-jerry-blueprint-analyzer.git
cd uncle-jerry-blueprint-analyzer
```

## Step 5: Set Environment Variables

Set your Anthropic API key:

```bash
export ANTHROPIC_API_KEY=your_api_key_here
```

To make this persistent, add it to your `.bashrc` file:

```bash
echo "export ANTHROPIC_API_KEY=your_api_key_here" >> ~/.bashrc
source ~/.bashrc
```

## Step 6: Run the Deployment Script

Make the deployment script executable and run it:

```bash
chmod +x deploy.sh
./deploy.sh
```

The script will:
1. Check for necessary environment variables
2. Install Docker and other required dependencies
3. Build the frontend
4. Prompt you for your domain name
5. Ask if you want to set up SSL certificates
6. Configure Apache with the appropriate settings
7. Set up firewall rules
8. Start all Docker containers

## Step 7: Verify the Deployment

After the script completes, access your application at:
- HTTP: http://your-domain.com
- HTTPS: https://your-domain.com (if SSL was configured)

You can also access MongoDB Express at:
- HTTP: http://your-domain.com/mongo
- HTTPS: https://your-domain.com/mongo (if SSL was configured)

## Troubleshooting

### SSL Certificate Issues

If you have problems with SSL certificates:

```bash
# Check certificate status
certbot certificates

# Try obtaining certificates manually
certbot certonly --standalone -d your-domain.com -d www.your-domain.com
```

### Docker Container Issues

If any containers aren't running properly:

```bash
# Check container status
docker ps -a

# View container logs
docker logs uncle-jerry-apache
docker logs uncle-jerry-backend
docker logs uncle-jerry-mongodb

# Restart containers
docker-compose -f docker-compose-apache.yml restart
```

### Firewall Issues

If you can't access your application:

```bash
# Check firewall status
ufw status

# Ensure ports are open
ufw allow 80/tcp
ufw allow 443/tcp
```

## Maintenance

### Updating the Application

To update the application:

```bash
cd /home/quarkvibe/uncle-jerry-blueprint-analyzer
git pull
./deploy.sh
```

### SSL Certificate Renewal

SSL certificates are set to auto-renew via cron job, but you can manually renew with:

```bash
certbot renew
docker restart uncle-jerry-apache
```

### Database Backup

To back up your MongoDB data:

```bash
# Create a backup
docker exec -it uncle-jerry-mongodb mongodump --out /data/db/backup

# Copy the backup to the host
docker cp uncle-jerry-mongodb:/data/db/backup ./mongodb-backup
```

## Security Recommendations

1. Set a strong password for MongoDB Express in docker-compose-apache.yml
2. Consider restricting access to the /mongo path in Apache configuration
3. Keep all system packages updated:
   ```bash
   apt update && apt upgrade -y
   ```
4. Use SSH keys instead of passwords for server access
5. Consider setting up a firewall to restrict access to only necessary ports