# Uncle Jerry Blueprint Analyzer - Management Guide

Quick reference for managing the Uncle Jerry Blueprint Analyzer site at unclejerry.ai.

## Common Operations

### Starting/Stopping Services

```bash
# Start all services
cd /home/quarkvibe/uncle-jerry-blueprint-analyzer
docker-compose -f docker-compose-apache.yml up -d

# Stop all services
docker-compose -f docker-compose-apache.yml down

# Restart a specific service
docker restart uncle-jerry-apache
docker restart uncle-jerry-backend
docker restart uncle-jerry-mongodb
docker restart uncle-jerry-mongo-express
```

### Viewing Logs

```bash
# Apache logs
docker exec -it uncle-jerry-apache cat /usr/local/apache2/logs/blueprint-error.log
docker exec -it uncle-jerry-apache cat /usr/local/apache2/logs/blueprint-access.log

# Backend logs
docker logs uncle-jerry-backend

# MongoDB logs
docker logs uncle-jerry-mongodb
```

### Database Management

```bash
# Access MongoDB Express UI
# Open in browser: https://unclejerry.ai/mongo

# Backup MongoDB data
docker exec -it uncle-jerry-mongodb mongodump --out /data/db/backup
docker cp uncle-jerry-mongodb:/data/db/backup ./mongodb-backup

# Restore MongoDB data
docker cp ./mongodb-backup uncle-jerry-mongodb:/data/db/backup
docker exec -it uncle-jerry-mongodb mongorestore /data/db/backup
```

### Updating the Application

```bash
# Pull latest code
git pull

# Rebuild and restart
cd /home/quarkvibe/uncle-jerry-blueprint-analyzer/frontend
npm install
npm run build

cd /home/quarkvibe/uncle-jerry-blueprint-analyzer
docker-compose -f docker-compose-apache.yml up -d --build
```

### SSL Certificate Management

```bash
# Manual renewal of SSL certificates
sudo certbot renew

# Check certificate expiration
sudo certbot certificates

# Force renewal
sudo certbot renew --force-renewal

# After renewal, restart Apache
docker restart uncle-jerry-apache
```

## Monitoring

### Container Status

```bash
# View all running containers
docker ps

# View container stats (CPU, memory usage)
docker stats

# Check disk space
df -h
```

### Application Health Checks

```bash
# Check if API is responsive
curl https://unclejerry.ai/api/test

# Check if MongoDB is accessible from backend
docker logs uncle-jerry-backend | grep "Connected to MongoDB"
```

## Troubleshooting

### Common Issues

1. **Website not accessible:**
   - Check if Apache container is running: `docker ps | grep uncle-jerry-apache`
   - Verify DNS settings: `dig unclejerry.ai`
   - Check firewall settings: `sudo ufw status`

2. **Backend API errors:**
   - Check logs: `docker logs uncle-jerry-backend`
   - Verify MongoDB connection: `docker logs uncle-jerry-backend | grep MongoDB`
   - Check environment variables: `docker exec -it uncle-jerry-backend env | grep MONGODB`

3. **MongoDB connection issues:**
   - Check if container is running: `docker ps | grep uncle-jerry-mongodb`
   - Check logs: `docker logs uncle-jerry-mongodb`
   - Verify network: `docker network inspect uncle-jerry-blueprint-analyzer_app-network`

4. **SSL certificate issues:**
   - Verify certificate files: `sudo ls -la /etc/letsencrypt/live/unclejerry.ai/`
   - Check Apache SSL config: `docker exec -it uncle-jerry-apache cat /usr/local/apache2/conf/extra/httpd-vhosts.conf`
   - Manually test certificate: `openssl s_client -connect unclejerry.ai:443`

## Security

### Recommended Regular Checks

1. Check for container updates:
   ```bash
   docker pull mongo:latest
   docker pull httpd:2.4
   docker pull mongo-express:latest
   ```

2. Check for npm vulnerabilities:
   ```bash
   cd /home/quarkvibe/uncle-jerry-blueprint-analyzer/backend
   npm audit

   cd /home/quarkvibe/uncle-jerry-blueprint-analyzer/frontend
   npm audit
   ```

3. Review access logs regularly:
   ```bash
   docker exec -it uncle-jerry-apache cat /usr/local/apache2/logs/blueprint-access.log | tail -n 100
   ```