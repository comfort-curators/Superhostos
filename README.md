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

## Deployable containers
Build images:
```bash
docker build -f apps/api/Dockerfile -t superhostos-api .
docker build -f apps/web/Dockerfile -t superhostos-web .
```

Run full stack locally:
```bash
docker compose up --build
```

Endpoints:
- Web: http://localhost:3000
- API: http://localhost:4000/health

## Required environment variables
API:
- `PORT`
- `REDIS_URL`
- `CLERK_SECRET_KEY`

Web:
- `VITE_API_BASE_URL`
- `VITE_CLERK_PUBLISHABLE_KEY`
