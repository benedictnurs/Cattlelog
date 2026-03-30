# Staging Environment Setup Guide

This guide explains how to set up and use the staging environment for Cattlelog.

## Overview

- **Branch**: `staging`
- **URL**: `https://staging.daviscattlelog.com`
- **Workflow**: `.github/workflows/staging-deploy.yml`
- **Docker Compose**: `infra/staging/docker-compose.yml`

## Architecture

```
Production (main branch):
├── Containers: cattlelog-frontend, cattlelog-backend, cattlelog-neptune
├── Network: cattlelog-network
├── Images: cattlelog-*:latest
└── URL: daviscattlelog.com

Staging (staging branch):
├── Containers: cattlelog-frontend-staging, cattlelog-backend-staging, cattlelog-neptune-staging
├── Network: cattlelog-staging-network
├── Images: cattlelog-*:staging
└── URL: staging.daviscattlelog.com
```

Both environments run on the **same server** with isolated networks and containers.

## Step 1: Create Staging Branch

```bash
git checkout -b staging
git push origin staging
```

## Step 2: Add GitHub Secrets

Go to your repository → Settings → Secrets and variables → Actions

Add these **new** secrets for staging:

| Secret Name | Value | Notes |
|-------------|-------|-------|
| `TUNNEL_TOKEN_STAGING` | `<your-staging-tunnel-token>` | New Cloudflare tunnel for staging |
| `VITE_API_BASE_URL_STAGING` | `https://staging-api.daviscattlelog.com` | Staging backend URL |
| `VITE_API_ALL_COURSES_URL_STAGING` | `https://staging-api.daviscattlelog.com/courses/all` | Staging neptune URL |

**Reuse these existing secrets** (same for staging and production):
- `DB_HOST`, `DB_NAME`, `DB_PASSWORD`, `DB_USER`
- `GOOGLE_API_KEY`, `POSTHOG_API_KEY`, `REDIS_URL`
- `VITE_POSTHOG_KEY`, `VITE_POSTHOG_HOST`
- `GRAFANA_USER`, `GRAFANA_PASSWORD`

## Step 3: Create Cloudflare Tunnel for Staging

### Option A: Create New Tunnel (Recommended)

1. Go to Cloudflare Zero Trust → Networks → Tunnels
2. Click "Create a tunnel"
3. Name it: `cattlelog-staging`
4. Copy the token → Add to GitHub Secrets as `TUNNEL_TOKEN_STAGING`

### Option B: Use Same Tunnel (Simpler)

Use the same `TUNNEL_TOKEN` for both environments. Just add different routes in Cloudflare.

## Step 4: Configure Cloudflare Routes

In Cloudflare Zero Trust → Networks → Tunnels → Your Staging Tunnel:

Add these Public Hostname routes:

| Subdomain | Domain | Service |
|-----------|--------|---------|
| `staging` | `daviscattlelog.com` | `http://cattlelog-frontend-staging:3000` |
| `staging-api` | `daviscattlelog.com` | `http://cattlelog-backend-staging:5000` |
| `staging-courses-api` | `daviscattlelog.com` | `http://cattlelog-neptune-staging:8000` |
| `staging-grafana` | `daviscattlelog.com` | `http://grafana-staging:3000` |

## Step 5: Deploy Staging

### Automatic Deploy (Recommended)

Push to the `staging` branch:

```bash
git checkout staging
git add .
git commit -m "Set up staging environment"
git push origin staging
```

The GitHub Actions workflow will automatically deploy.

### Manual Deploy

```bash
# On your server
cd /path/to/course-recommender
git checkout staging
git pull

# Set environment variables
export TUNNEL_TOKEN_STAGING=<your-token>
export VITE_API_BASE_URL=https://staging-api.daviscattlelog.com
export VITE_API_ALL_COURSES_URL=https://staging-courses-api.daviscattlelog.com
# ... other env vars

# Deploy
docker-compose -f infra/staging/docker-compose.yml up -d
```

## Step 6: Verify Deployment

Check that all containers are running:

```bash
docker ps | grep staging
```

You should see:
- `cattlelog-frontend-staging`
- `cattlelog-backend-staging`
- `cattlelog-neptune-staging`

**Note:** Infrastructure services (networking and observability) are deployed separately:
- Networking: `cloudflared-tunnel-staging` (via manual workflow dispatch)
- Observability: `loki-staging`, `promtail-staging`, `grafana-staging` (via manual workflow dispatch)

## Deploying Infrastructure

Infrastructure services (networking and observability) are deployed separately from application code.

### Deploy Networking Infrastructure (Required for Access)

Via GitHub Actions:
1. Go to Actions → "Deploy Networking Infrastructure (Staging)"
2. Click "Run workflow"

Or manually:
```bash
docker-compose -p cattlelog-staging -f infra/staging/docker-compose.networking.yml up -d
```

### Deploy Observability Stack (Optional)

Via GitHub Actions:
1. Go to Actions → "Deploy Observability Infrastructure (Staging)"
2. Click "Run workflow"

Or manually:
```bash
docker-compose -p cattlelog-staging -f infra/staging/docker-compose.observability.yml up -d
```

## Accessing Staging

- **Frontend**: https://staging.daviscattlelog.com
- **Backend API**: https://staging-api.daviscattlelog.com
- **Neptune API**: https://staging-courses-api.daviscattlelog.com
- **Grafana**: https://staging-grafana.daviscattlelog.com

## Workflow

### Development Flow

```
feature-branch → staging (test) → main (production)
```

1. Develop on feature branch
2. Merge to `staging` for testing
3. Test on `staging.daviscattlelog.com`
4. Once verified, merge `staging` → `main`
5. Production deploys automatically

### Testing Changes

```bash
# Make changes on feature branch
git checkout -b feature/new-feature

# ... make changes ...

# Merge to staging for testing
git checkout staging
git merge feature/new-feature
git push origin staging

# Test at staging.daviscattlelog.com

# If good, merge to main
git checkout main
git merge staging
git push origin main
```

## Managing Both Environments

### View All Containers

```bash
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

### View Logs

```bash
# Staging logs
docker logs cattlelog-frontend-staging
docker logs cattlelog-backend-staging

# Production logs
docker logs cattlelog-frontend
docker logs cattlelog-backend
```

### Stop/Start Environments

```bash
# Stop staging
docker-compose -f infra/staging/docker-compose.yml down

# Stop production
docker-compose -f infra/production/docker-compose.yml down

# Start staging
docker-compose -f infra/staging/docker-compose.yml up -d

# Start production
docker-compose -f infra/production/docker-compose.yml up -d
```

## Troubleshooting

### Staging not deploying?

Check GitHub Actions:
- Repository → Actions → Deploy Cattlelog Staging
- Look for errors in the workflow run

### Can't access staging.daviscattlelog.com?

1. Check Cloudflare tunnel is running: `docker logs cloudflared-tunnel-staging`
2. Verify routes in Cloudflare dashboard
3. Check container is running: `docker ps | grep frontend-staging`

### Port conflicts?

Staging and production use separate networks, so no conflicts!

### Database concerns?

Both environments use the **same database**. Consider:
- Using a separate staging database
- Using different table prefixes
- Being careful with data modifications in staging

## Cleanup

To remove staging environment:

```bash
# Stop and remove staging containers
docker-compose -f infra/staging/docker-compose.yml down

# Remove staging volumes (if needed)
docker-compose -f infra/staging/docker-compose.yml down -v

# Remove staging images
docker rmi cattlelog-frontend:staging cattlelog-backend:staging cattlelog-neptune:staging
```

## Summary

✅ **Isolated environments** - Staging and production don't interfere
✅ **Same server** - No extra infrastructure costs
✅ **Automatic deploys** - Push to staging branch = deploy
✅ **Full feature parity** - Staging has Grafana, logging, everything
✅ **Safe testing** - Test before production

Happy staging! 🚀

