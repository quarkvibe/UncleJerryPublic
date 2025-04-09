# Deployment Guide for UncleJerry.ai

This guide will help you deploy the Uncle Jerry Blueprint Analyzer to a public server with the unclejerry.ai domain.

## Prerequisites

- A server with public IP address (e.g., AWS EC2, DigitalOcean Droplet, etc.)
- Domain name unclejerry.ai registered and DNS configured
- SSH access to the server
- Root or sudo privileges on the server

## Step 1: Set Up DNS

1. Log in to your domain registrar's control panel
2. Create A records for unclejerry.ai and www.unclejerry.ai pointing to your server's public IP address:
   - unclejerry.ai → Your-Server-IP
   - www.unclejerry.ai → Your-Server-IP

## Step 2: Prepare Your Server

1. SSH into your server
2. Clone the repository:
   ```
   git clone https://github.com/your-username/uncle-jerry-blueprint-analyzer.git
   cd uncle-jerry-blueprint-analyzer
   ```

3. Configure environment variables:
   ```
   cp backend/.env.example backend/.env
   nano backend/.env
   ```
   Update with your actual values:
   ```
   PORT=3001
   MONGODB_URI=mongodb://mongodb:27017/uncle-jerry-blueprint-analyzer
   ANTHROPIC_API_KEY=your_api_key_here
   ```

## Step 3: Deploy using the Production Script

1. Run the deployment script:
   ```
   sudo ./deploy-production.sh
   ```

   This script will:
   - Install Docker and necessary dependencies
   - Build the frontend
   - Set up SSL certificates with Let's Encrypt
   - Configure Apache with HTTPS
   - Start all containers
   - Set up auto-renewal for SSL certificates

2. Verify the deployment:
   - Access your website at https://unclejerry.ai
   - Access MongoDB Express at https://unclejerry.ai/mongo

## Step 4: Verify the Deployment

1. Check if containers are running:
   ```
   docker ps
   ```

2. Check the logs:
   ```
   docker logs uncle-jerry-apache
   docker logs uncle-jerry-backend
   docker logs uncle-jerry-mongodb
   ```

## Troubleshooting

1. If SSL certificates fail to generate:
   - Ensure your domain is correctly pointing to your server
   - Check that ports 80 and 443 are open in your firewall
   - Try manually running:
     ```
     certbot certonly --standalone -d unclejerry.ai -d www.unclejerry.ai
     ```

2. If the application is not accessible:
   - Check if all containers are running: `docker ps`
   - Check the Apache logs:
     ```
     docker exec -it uncle-jerry-apache cat /usr/local/apache2/logs/blueprint-error.log
     ```
   - Verify that your firewall allows traffic on ports 80 and 443:
     ```
     sudo ufw status
     ```

3. If MongoDB connection fails:
   - Check the backend logs:
     ```
     docker logs uncle-jerry-backend
     ```
   - Verify MongoDB is running:
     ```
     docker logs uncle-jerry-mongodb
     ```

## Security Considerations

1. Secure MongoDB:
   - Change default admin credentials in docker-compose-apache.yml
   - Restrict access to /mongo in Apache configuration for production

2. API Key Protection:
   - Ensure your Anthropic API key is not exposed in client-side code
   - Consider setting up environment-specific configurations

3. Regular Updates:
   - Keep Docker images updated
   - Regularly update your application dependencies
   - Keep the server's operating system updated

## Backup and Maintenance

1. Database Backup:
   ```
   docker exec -it uncle-jerry-mongodb mongodump --out /data/db/backup
   docker cp uncle-jerry-mongodb:/data/db/backup ./mongodb-backup
   ```

2. Scheduled Maintenance:
   - Add a cron job for database backups
   - Configure log rotation

## Scaling Considerations

1. For higher traffic:
   - Consider adding a load balancer
   - Implement caching for static content
   - Scale MongoDB with replication