# Docker Deployment Guide

This guide covers deploying the MTG Card Manager using Docker containers.

## Prerequisites

- **Docker** 20.10+ - [Install Docker](https://docs.docker.com/get-docker/)
- **Docker Compose** 2.0+ - [Install Docker Compose](https://docs.docker.com/compose/install/)
- **Google OAuth Credentials** - See [AUTHENTICATION_SETUP.md](AUTHENTICATION_SETUP.md)

## Quick Start

### 1. Configure Environment Variables

```bash
# Copy the environment template
cp .env.example .env

# Edit .env with your credentials
nano .env
```

Required variables:
```env
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
SESSION_SECRET=your_random_session_secret_here
```

Generate a session secret:
```bash
openssl rand -hex 32
# OR
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 2. Update Google OAuth Redirect URIs

In Google Cloud Console, update your OAuth 2.0 Client authorized redirect URIs:
- Add: `http://localhost:3001/auth/google/callback`

And authorized JavaScript origins:
- Add: `http://localhost:3000`

### 3. Start the Application

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Check status
docker-compose ps
```

### 4. Access the Application

Open your browser to: **http://localhost:3000**

The application stack includes:
- **Frontend**: http://localhost:3000 (Nginx + Vue.js)
- **Backend API**: http://localhost:3001 (Node.js + Express)
- **MongoDB**: localhost:27017 (Database)

## Docker Compose Services

### MongoDB (`mongodb`)
- **Image**: mongo:7.0
- **Port**: 27017
- **Volume**: `mongodb_data` (persistent storage)
- **Network**: mtg-network

### Backend (`backend`)
- **Build**: ./server/Dockerfile
- **Port**: 3001
- **Dependencies**: MongoDB
- **Network**: mtg-network

### Frontend (`frontend`)
- **Build**: ./Dockerfile
- **Port**: 3000 (mapped to container port 80)
- **Dependencies**: Backend
- **Network**: mtg-network
- **Server**: Nginx

## Common Commands

### Start Services
```bash
# Start in background
docker-compose up -d

# Start in foreground (see logs)
docker-compose up

# Start specific service
docker-compose up -d backend
```

### Stop Services
```bash
# Stop all services
docker-compose down

# Stop and remove volumes (⚠️ deletes data)
docker-compose down -v
```

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mongodb

# Last 100 lines
docker-compose logs --tail=100 backend
```

### Restart Services
```bash
# Restart all
docker-compose restart

# Restart specific service
docker-compose restart backend
```

### Rebuild Images
```bash
# Rebuild all images
docker-compose build

# Rebuild specific service
docker-compose build backend

# Rebuild and restart
docker-compose up -d --build
```

### Execute Commands in Containers
```bash
# Access MongoDB shell
docker-compose exec mongodb mongosh mtg-card-manager

# Access backend shell
docker-compose exec backend sh

# View backend environment
docker-compose exec backend env
```

## Development vs Production

### Development Mode

For development with hot-reload:

```bash
# Use separate containers for dev
docker run -d --name mtg-mongodb -p 27017:27017 mongo:7.0

# Run backend and frontend locally
cd server && npm start
npm run dev
```

### Production Mode

For production deployment:

1. **Update `.env` for production:**
   ```env
   GOOGLE_CLIENT_ID=prod_client_id
   GOOGLE_CLIENT_SECRET=prod_secret
   SESSION_SECRET=strong_production_secret
   ```

2. **Update Google OAuth redirect URIs** with your production domain:
   - `https://yourdomain.com/auth/google/callback`
   - `https://yourdomain.com`

3. **Update `docker-compose.yml`:**
   ```yaml
   backend:
     environment:
       - NODE_ENV=production
       - FRONTEND_URL=https://yourdomain.com
   ```

4. **Enable HTTPS** (recommended with Nginx reverse proxy or Traefik)

## Data Management

### Backup MongoDB Data

```bash
# Create backup
docker-compose exec mongodb mongodump --db mtg-card-manager --out /data/backup

# Copy backup from container
docker cp mtg-mongodb:/data/backup ./mongodb-backup-$(date +%Y%m%d)
```

### Restore MongoDB Data

```bash
# Copy backup to container
docker cp ./mongodb-backup mtg-mongodb:/data/restore

# Restore data
docker-compose exec mongodb mongorestore --db mtg-card-manager /data/restore/mtg-card-manager
```

### View Database

```bash
# Connect to MongoDB
docker-compose exec mongodb mongosh mtg-card-manager

# MongoDB commands
show collections
db.wishlists.countDocuments()
db.wishlists.find().pretty()
db.decks.find().pretty()
```

### Clear All Data (⚠️ Destructive)

```bash
# Stop containers and remove volumes
docker-compose down -v

# Start fresh
docker-compose up -d
```

## Troubleshooting

### Port Already in Use

```bash
# Check what's using the port
lsof -i :3000  # or :3001, :27017

# Stop the conflicting service or change ports in docker-compose.yml
```

### Container Won't Start

```bash
# View detailed logs
docker-compose logs backend

# Check container status
docker-compose ps

# Rebuild from scratch
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### MongoDB Connection Issues

```bash
# Check if MongoDB is running
docker-compose exec mongodb mongosh --eval "db.version()"

# Check backend can reach MongoDB
docker-compose exec backend ping mongodb

# View backend logs
docker-compose logs backend | grep -i mongo
```

### Frontend Can't Connect to Backend

1. Check backend is running: `docker-compose ps backend`
2. Check backend logs: `docker-compose logs backend`
3. Verify API URL in browser console
4. Check CORS settings in backend

### Authentication Issues

1. Verify environment variables: `docker-compose exec backend env | grep GOOGLE`
2. Check redirect URIs in Google Cloud Console
3. Clear browser cookies and try again
4. Check session secret is set: `docker-compose exec backend env | grep SESSION`

## Monitoring

### Container Health

```bash
# Resource usage
docker stats

# Inspect container
docker-compose exec backend sh
docker-compose exec frontend sh

# Check running processes
docker-compose exec backend ps aux
```

### Database Health

```bash
# MongoDB server status
docker-compose exec mongodb mongosh --eval "db.serverStatus()"

# Database stats
docker-compose exec mongodb mongosh mtg-card-manager --eval "db.stats()"

# Collection counts
docker-compose exec mongodb mongosh mtg-card-manager --eval "
  print('Wishlists:', db.wishlists.countDocuments());
  print('Decks:', db.decks.countDocuments());
  print('Purchases:', db.purchases.countDocuments());
"
```

## Updating the Application

```bash
# Pull latest code
git pull

# Rebuild and restart
docker-compose down
docker-compose build
docker-compose up -d

# Or in one command
docker-compose up -d --build
```

## Scaling (Advanced)

For high-traffic scenarios:

```yaml
# docker-compose.yml
backend:
  deploy:
    replicas: 3
  # ... rest of config

# Use a load balancer (Nginx, Traefik, etc.)
```

## Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `GOOGLE_CLIENT_ID` | Yes | - | Google OAuth Client ID |
| `GOOGLE_CLIENT_SECRET` | Yes | - | Google OAuth Client Secret |
| `SESSION_SECRET` | Yes | - | Session encryption secret |
| `NODE_ENV` | No | `production` | Node environment |
| `PORT` | No | `3001` | Backend port |
| `MONGODB_URI` | No | `mongodb://mongodb:27017/mtg-card-manager` | MongoDB connection string |
| `FRONTEND_URL` | No | `http://localhost:3000` | Frontend URL for CORS |

## Security Best Practices

1. **Never commit `.env` file** - It contains secrets
2. **Use strong SESSION_SECRET** - Generate with `openssl rand -hex 32`
3. **Enable HTTPS in production** - Use Nginx with Let's Encrypt
4. **Restrict MongoDB access** - Don't expose port 27017 in production
5. **Regular backups** - Automate MongoDB backups
6. **Update dependencies** - Keep Docker images and npm packages updated
7. **Use secrets management** - For production, use Docker secrets or vault

## Production Deployment Options

### Option 1: Docker Compose on VPS
- DigitalOcean, Linode, AWS EC2
- Use `docker-compose` as shown
- Add Nginx reverse proxy with SSL

### Option 2: Kubernetes
- Convert to Kubernetes manifests
- Use Helm charts
- Managed K8s (EKS, GKE, AKS)

### Option 3: Managed Services
- Frontend: Vercel, Netlify, AWS S3 + CloudFront
- Backend: AWS ECS, Google Cloud Run, Heroku
- Database: MongoDB Atlas, AWS DocumentDB

## Getting Help

- **Docker Issues**: https://docs.docker.com/
- **Docker Compose**: https://docs.docker.com/compose/
- **MongoDB in Docker**: https://hub.docker.com/_/mongo
- **Nginx**: https://nginx.org/en/docs/

## Quick Reference Card

```bash
# Start everything
docker-compose up -d

# View logs
docker-compose logs -f

# Stop everything
docker-compose down

# Rebuild after code changes
docker-compose up -d --build

# Access MongoDB
docker-compose exec mongodb mongosh mtg-card-manager

# Backup database
docker-compose exec mongodb mongodump --db mtg-card-manager --out /backup

# Restart a service
docker-compose restart backend

# View resource usage
docker stats
```
