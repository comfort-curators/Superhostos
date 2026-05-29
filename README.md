# SuperhostOS
Operational infrastructure platform for hospitality businesses.

## Stack
- Frontend: React 18 + Vite + Clerk + TanStack Query
- Backend: Fastify + Zod + Drizzle + BullMQ
- Data: PostgreSQL + Redis
- Infra: Docker, ECS Fargate compatible

## Local development
```bash
pnpm install
pnpm dev
```

## CI/Build validation
```bash
pnpm -w typecheck
pnpm -w build
```

## Container builds
```bash
docker build -f apps/api/Dockerfile -t ghcr.io/superhostos/api:latest .
docker build -f apps/web/Dockerfile -t ghcr.io/superhostos/web:latest .
```

## Production domain deployment (www.superhostos.com)
This repository now includes a production compose stack and Caddy reverse proxy:
- `deploy/docker-compose.prod.yml`
- `deploy/Caddyfile`
- `deploy/.env.prod.example`

### 1) DNS records
Create DNS records:
- `A` record `www.superhostos.com` -> your VM public IP
- `A` record `api.superhostos.com` -> your VM public IP

### 2) Prepare environment
```bash
cp deploy/.env.prod.example deploy/.env.prod
# edit deploy/.env.prod with real production secrets
```

### 3) Start production stack
```bash
docker compose --env-file deploy/.env.prod -f deploy/docker-compose.prod.yml up -d
```

Caddy will provision TLS certificates automatically and route:
- `https://www.superhostos.com` -> web frontend
- `https://api.superhostos.com` -> Fastify API

## Required environment variables
API:
- `PORT`
- `REDIS_URL`
- `CLERK_SECRET_KEY`
- `DATABASE_URL`

Web:
- `VITE_API_BASE_URL`
- `VITE_CLERK_PUBLISHABLE_KEY`
