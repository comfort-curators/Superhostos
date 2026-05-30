# Deploying SuperhostOS to DigitalOcean App Platform

This directory contains [`app.yaml`](./app.yaml), a complete App Platform spec
that runs the whole product as **one app on one domain**:

| Path | Component | What it is |
|------|-----------|------------|
| `/` | `web` | The Vite/React SPA, served as a static site (SPA fallback to `index.html`). |
| `/v1`, `/health` | `api` | The Fastify API, built from `apps/api/Dockerfile`. |

It also provisions a managed **PostgreSQL** and **Redis (Valkey)** database and
binds their connection strings into the API automatically. The web app talks to
the API **same-origin**, so no CORS or cross-domain config is needed.

## Prerequisites

- A DigitalOcean account (the Hatch credits cover this comfortably).
- [`doctl`](https://docs.digitalocean.com/reference/doctl/how-to/install/) installed and authenticated: `doctl auth init`.
- This repo connected to GitHub (App Platform deploys from the branch).

## Deploy

```bash
# From the repo root
doctl apps create --spec .do/app.yaml
```

Or, in the dashboard: **Create App → skip the source picker → "Edit your App
Spec"** and paste `app.yaml`.

App Platform will: build the API image, build the web static site, create the
Postgres + Redis databases, wire the env vars, and give you a
`*.ondigitalocean.app` URL.

## Set the secrets

The spec ships placeholder `REPLACE_IN_DASHBOARD` values for secrets so nothing
sensitive lives in git. After the first deploy, set the real values under
**Settings → App-Level / Component Env**:

| Variable | Component | Required? | Notes |
|----------|-----------|-----------|-------|
| `CLERK_SECRET_KEY` | api | required | Backend session verification. |
| `VITE_CLERK_PUBLISHABLE_KEY` | web (build-time) | optional | Set to turn on Clerk auth; leave empty to run open. |
| `ANTHROPIC_API_KEY` / `GEMINI_API_KEY` | api | optional | For the AI provider abstraction. |
| `DATABASE_URL`, `REDIS_URL` | api | auto | Bound from the managed databases — do not set by hand. |

After setting secrets, redeploy (the dashboard prompts you, or
`doctl apps update <APP_ID> --spec .do/app.yaml`).

## Pointing your domain

Add `www.superhostos.com` (and/or `app.superhostos.com`) under **Settings →
Domains**; App Platform provisions TLS automatically. Update the DNS as
instructed.

## Notes & next steps

- **Databases are `production: false`** (dev tier) for the trial. For real
  traffic, set `production: true` and add `size`/`num_nodes` in `app.yaml`.
- **Migrations:** the API currently runs on in-memory repositories; once the
  Drizzle schema is wired to Postgres, add a pre-deploy `job` in the spec to run
  migrations against `${db.DATABASE_URL}`.
- **DO Inference Cloud:** your Inference trial can back the AI provider
  abstraction (OpenAI-compatible endpoint). When ready, add the inference base
  URL + key as API secrets and point the provider at it — no app re-architecture
  needed.
- The existing `deploy/docker-compose.prod.yml` + Caddyfile remain valid if you
  prefer a single **Droplet** instead of App Platform.
