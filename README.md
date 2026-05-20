# SuperhostOS

**AI-native operating system for short-term rental infrastructure.**

Infrastructure layer for AI-assisted hospitality operations — not a CRUD Airbnb clone. Multi-tenant, production-grade monorepo powering real operations at scale.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18 + Vite + Wouter + TanStack Query + shadcn/ui + Framer Motion |
| Backend | Express 5 + Node 24 + Pino |
| Database | PostgreSQL + Drizzle ORM + Zod |
| State | React Context + TanStack Query |
| Tooling | pnpm workspaces + Turborepo + Biome |
| Deployment | Vercel (web) + Railway (api) |

## Monorepo Structure

```
superhostos/
├── apps/
│   ├── web/          # Vite React frontend
│   └── api/          # Express 5 backend
├── packages/
│   ├── db/           # Drizzle schema + types
│   ├── api-spec/     # OpenAPI + Orval
│   ├── api-client/   # Generated hooks
│   └── api-zod/      # Generated Zod
├── docs/
│   └── architecture/
└── turbo.json
```

## Quick Start

```bash
pnpm install
pnpm dev          # starts web + api
```

Requires: Node 24, pnpm 9, PostgreSQL 16, Redis 7 (optional for MVP)

## Environment

Copy `.env.example` → `.env` and fill required vars.

## Architecture Philosophy

This is infrastructure, not a feature app. Every component is built for multi-tenant scale, AI extensibility, and zero-downtime operations. Mock data today, real Postgres + OpenAI tomorrow.

## Roadmap

**Phase 1 (MVP)**: Mock data → real Drizzle queries + basic AI chat
**Phase 2**: Multi-tenant orgs + RLS + auth
**Phase 3**: Marketplace + BullMQ jobs + full OpenAPI codegen

## License
Proprietary — contact for enterprise access.