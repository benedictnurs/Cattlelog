# Infrastructure Configuration

This directory contains all infrastructure-related configuration files for Cattlelog, organized by environment.

## Contents

### Environment Directories

#### `production/`
- **`docker-compose.yml`** - Application stack (frontend, backend, neptune)
- **`docker-compose.networking.yml`** - Networking infrastructure (Cloudflare tunnel)
- **`docker-compose.observability.yml`** - Observability stack (Grafana, Loki, Promtail)

#### `staging/`
- **`docker-compose.yml`** - Application stack (frontend, backend, neptune)
- **`docker-compose.networking.yml`** - Networking infrastructure (Cloudflare tunnel)
- **`docker-compose.observability.yml`** - Observability stack (Grafana, Loki, Promtail)

### Monitoring Configuration

- **`grafana/`** - Grafana configuration and dashboards
  - `dashboards/` - Pre-configured dashboards for logs and metrics
  - `datasources/` - Loki datasource configuration
  - `promtail-config.yml` - Promtail log collection configuration

## Deployment

### Application Stacks

Application stacks are deployed automatically via GitHub Actions:

**Production:**
```bash
docker-compose -p cattlelog-production -f infra/production/docker-compose.yml up -d
```

**Staging:**
```bash
docker-compose -p cattlelog-staging -f infra/staging/docker-compose.yml up -d
```

### Networking Infrastructure

Networking infrastructure is deployed manually via GitHub Actions workflow dispatch:

**Production:**
```bash
docker-compose -p cattlelog-production -f infra/production/docker-compose.networking.yml up -d
```

**Staging:**
```bash
docker-compose -p cattlelog-staging -f infra/staging/docker-compose.networking.yml up -d
```

### Observability Stacks

Observability stacks are deployed manually via GitHub Actions workflow dispatch:

**Production:**
```bash
docker-compose -p cattlelog-production -f infra/production/docker-compose.observability.yml up -d
```

**Staging:**
```bash
docker-compose -p cattlelog-staging -f infra/staging/docker-compose.observability.yml up -d
```

## Architecture

### Production Environment
- Network: `cattlelog-network`
- Application: `cattlelog-frontend`, `cattlelog-backend`, `cattlelog-neptune`
- Infrastructure: `cloudflared-tunnel`
- Observability: `grafana`, `loki`, `promtail`

### Staging Environment
- Network: `cattlelog-staging-network`
- Application: `cattlelog-frontend-staging`, `cattlelog-backend-staging`, `cattlelog-neptune-staging`
- Infrastructure: `cloudflared-tunnel-staging`
- Observability: `grafana-staging`, `loki-staging`, `promtail-staging`

Both environments run on the same server with isolated networks and containers.

## Workflows

### Production Workflows
- **`production-deploy.yml`** - Application deployment (auto on push to main)
- **`production-deploy-networking.yml`** - Networking infrastructure deployment (manual)
- **`production-deploy-observability.yml`** - Observability deployment (manual)

### Staging Workflows
- **`staging-deploy.yml`** - Application deployment (auto on push to staging)
- **`staging-deploy-networking.yml`** - Networking infrastructure deployment (manual)
- **`staging-deploy-observability.yml`** - Observability deployment (manual)

## Notes

- All stacks share the same Docker networks to enable communication between services
- Infrastructure deployments (networking and observability) are decoupled from application deployments
  - This minimizes downtime during application updates
  - Networking tunnels and monitoring remain active during app redeployments
- All containers restart automatically unless stopped manually
- Networks are marked as `external: true` in infrastructure stacks to use the networks created by application stacks

