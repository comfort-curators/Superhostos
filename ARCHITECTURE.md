# SuperhostOS — System Architecture
## Vision
SuperhostOS is an operational infrastructure platform for hospitality businesses.
The goal is not just property management.
The goal is:
- operational automation
- AI-assisted hospitality workflows
- multi-property orchestration
- predictive operations
- centralized data infrastructure
The long-term moat is operational data loops across hospitality systems.
---
# Core Principles
1. Event-first architecture
2. API-first backend
3. Infrastructure simplicity over overengineering
4. Operational reliability > premature scale
5. Modular AI provider abstraction
6. Queue-driven async processing
7. Strict TypeScript everywhere
---
# Tech Stack
## Frontend
- React 18
- Vite
- TailwindCSS
- Zustand
- TanStack Query
- React Router
Deployment:
- Vercel
---
## Backend
- Fastify
- TypeScript
- Zod validation
- Drizzle ORM
Deployment:
- AWS App Runner initially
- ECS Fargate later
---
## Database
- PostgreSQL (AWS RDS)
Reason:
Hospitality operations are highly relational:
- bookings
- calendars
- cleaners
- vendors
- guests
- maintenance
- pricing
- messaging
---
## Cache / Queue
- Redis
- BullMQ
Used for:
- AI jobs
- retry queues
- scheduled operations
- websocket state
- rate limiting
- temporary booking locks
---
## Storage
- AWS S3
Used for:
- invoices
- guest documents
- property images
- damage photos
- reports
- AI exports
---
## CDN
- AWS CloudFront
---
## Email
- AWS SES
Used for:
- booking emails
- OTPs
- alerts
- AI-generated messaging
---
## Monitoring
- CloudWatch
- Sentry
---
## Authentication
- Clerk
---
# Infrastructure Layout
Users
↓
Vercel Frontend
↓
CloudFront CDN
↓
AWS WAF
↓
App Runner / ECS
↓
Fastify API
↓
PostgreSQL (RDS)
↓
Redis
↓
Worker Services
↓
S3 Storage
---
# Monorepo Structure
/apps
  /web
  /api
  /worker
/packages
  /ui
  /db
  /shared
  /types
  /config
/infra
  /terraform
/docker
/docs
---
# Backend Architecture
## API Service
Handles:
- authentication
- dashboards
- booking APIs
- property APIs
- messaging APIs
- analytics queries
Must remain lightweight and responsive.
---
## Worker Service
Handles:
- AI messaging
- calendar sync
- scheduled reminders
- housekeeping automation
- report generation
- pricing jobs
- email processing
Workers are isolated from API runtime.
---
# Event System
System should be event-driven.
Example:
BookingConfirmed
→ send invoice
→ notify cleaner
→ update calendar
→ trigger AI workflow
→ update analytics
→ sync OTA channels
Events are critical to scaling operations cleanly.
---
# Database Design
## Core Tables
### users
- id
- email
- role
- created_at
### organizations
- id
- name
- plan
- created_at
### properties
- id
- organization_id
- title
- address
- timezone
- checkin_time
- checkout_time
### bookings
- id
- property_id
- guest_id
- source
- status
- checkin_date
- checkout_date
- total_amount
### guests
- id
- full_name
- email
- phone
- notes
### cleaners
- id
- name
- phone
- rating
### cleaning_tasks
- id
- booking_id
- cleaner_id
- status
- scheduled_at
### maintenance_tasks
- id
- property_id
- priority
- status
- description
### ai_messages
- id
- booking_id
- provider
- prompt
- response
- tokens_used
### audit_logs
- id
- event_type
- payload
- created_at
---
# AI Architecture
## AI Provider Abstraction
/providers
  openai.ts
  anthropic.ts
  gemini.ts
All AI providers implement same interface.
Avoid hard-coupling AI logic to one provider.
---
# Queue Design
## Queues
### ai-processing
AI guest responses
### calendar-sync
OTA synchronization
### email-delivery
Email processing
### housekeeping
Cleaning workflows
### retry-dead-letter
Failed job recovery
---
# Security
## Required
- JWT validation
- webhook signature verification
- rate limiting
- audit logs
- DB backups
- secret rotation
- HTTPS everywhere
## Not Required Initially
- Kubernetes
- multi-region infra
- service mesh
- enterprise IAM complexity
---
# Deployment Strategy
## Phase 1
Frontend:
- Vercel
Backend:
- AWS App Runner
Database:
- RDS PostgreSQL
Storage:
- S3
---
## Phase 2
Move to:
- ECS Fargate
- Redis
- Queue workers
- background processing
---
## Phase 3
Add:
- predictive analytics
- AI orchestration
- dynamic pricing engine
- operational intelligence
---
# Cost Control
## Biggest AWS Cost Risks
- NAT gateways
- idle RDS instances
- excessive CloudWatch logging
- GPU experiments
- overprovisioned ECS tasks
---
# AWS Budget Rules
Create:
- billing alarms
- monthly budgets
- anomaly detection alerts
Immediately.
---
# Non Goals
Do NOT build initially:
- blockchain integrations
- custom AI models
- Kubernetes
- multi-cloud
- advanced BI systems
- enterprise RBAC complexity
---
# Product Philosophy
The dashboard is not the product.
The operational coordination layer is the product.
The real asset becomes:
- operational intelligence
- behavioral data
- automation systems
- prediction systems
- hospitality infrastructure graph