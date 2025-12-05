# nevous-crm Design Document

## Overview

Sales/business CRM for small teams with a clear path to enterprise scale. Web app with API-first architecture, built on Node.js/TypeScript.

## Goals

- **First milestone:** Internal use - team can run real sales workflows day-to-day
- **Second milestone:** Beta launch - ready for early external users
- **Third milestone:** Production-ready - full polish, ready for real customers

## Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | Fastify, TypeScript |
| Database | PostgreSQL (Fly Postgres) |
| ORM | Drizzle |
| Validation | Zod |
| Auth | Lucia + Arctic |
| Frontend | React 18, Vite |
| Routing | React Router |
| State | TanStack Query |
| Forms | React Hook Form + Zod |
| UI | shadcn/ui + Tailwind CSS |
| Deployment | Fly.io |

## Architecture

Modular monolith - single Fastify backend with well-separated modules, React SPA frontend. Deploys as one unit to Fly.io.

### Project Structure

```
nevous-crm/
├── src/
│   ├── api/              # Fastify routes & handlers
│   │   ├── contacts/
│   │   ├── companies/
│   │   ├── deals/
│   │   ├── activities/
│   │   └── auth/
│   ├── services/         # Business logic layer
│   ├── db/               # Database schema, migrations, queries
│   ├── shared/           # Shared types, utils, validation schemas
│   └── server.ts         # Fastify app entry point
├── web/                  # React SPA (Vite)
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── api/          # API client
│   │   └── main.tsx
│   └── index.html
├── package.json          # Monorepo root (npm workspaces)
└── fly.toml
```

## Data Models

```
┌─────────────┐       ┌─────────────┐
│   Company   │───────│   Contact   │
└─────────────┘  1:N  └─────────────┘
       │                     │
       │ N:N                 │ N:1
       ▼                     ▼
┌─────────────┐       ┌─────────────┐
│    Deal     │───────│  Activity   │
└─────────────┘  1:N  └─────────────┘
```

### Entities

| Entity | Key Fields |
|--------|------------|
| User | id, email, name, role, team_id |
| Team | id, name, settings |
| Company | id, name, domain, industry, team_id |
| Contact | id, name, email, phone, company_id, owner_id |
| Deal | id, title, value, stage, probability, company_id, contact_id, owner_id |
| Activity | id, type (call/email/meeting/task), due_at, completed_at, deal_id, contact_id, user_id |

### Relationships

- Contacts belong to Companies (optional)
- Deals link to Company and/or Contact
- Activities link to Deals, Contacts, or both
- Everything scoped to Team for multi-tenancy
- Owner (User) assigned to Contacts and Deals

## API Design

RESTful API at `/api/v1/{resource}`.

| Endpoint | Methods | Description |
|----------|---------|-------------|
| `/api/v1/contacts` | GET, POST | List/create contacts |
| `/api/v1/contacts/:id` | GET, PUT, DELETE | Single contact operations |
| `/api/v1/contacts/:id/activities` | GET, POST | Activities for a contact |
| `/api/v1/companies` | GET, POST | List/create companies |
| `/api/v1/companies/:id/contacts` | GET | Contacts at a company |
| `/api/v1/deals` | GET, POST | List/create deals |
| `/api/v1/deals/:id/activities` | GET, POST | Activities for a deal |
| `/api/v1/activities` | GET, POST | List/create activities |
| `/api/v1/auth/*` | POST | Login, register, OAuth callbacks |
| `/api/v1/users/me` | GET, PUT | Current user profile |

### Conventions

- **Filtering:** `?stage=negotiation&owner_id=123`
- **Sorting:** `?sort=-created_at` (prefix `-` for descending)
- **Pagination:** `?limit=50&cursor=abc123` (cursor-based)
- **Includes:** `?include=company,activities`
- **Auth:** JWT in `Authorization: Bearer` header

## Authentication

### Email/Password
1. User registers with email + password
2. Password hashed with Argon2
3. Session created, JWT issued
4. JWT stored in httpOnly cookie

### OAuth (Google/GitHub)
1. Redirect to provider consent screen
2. Callback with auth code → exchange for tokens
3. Create or link user account
4. Session created, same JWT flow

### Session Management
- Access token: 15 min expiry
- Refresh token: 7 days, rotated on use
- Sessions stored in PostgreSQL

### Roles & Permissions

```
owner  → full access, manage billing, delete team
admin  → manage users, all CRUD
member → CRUD own records, view team records
viewer → read-only access
```

All queries automatically scoped to user's team.

## Deployment

### Fly.io Setup

```
nevous-crm (Fly App)
├── web machine(s)     # Fastify serves API + static React build
└── Fly Postgres       # Managed PostgreSQL cluster
```

Single deployment: Vite builds React, Fastify serves static files + API.

### Scaling Path
1. Start: 1 shared-cpu machine
2. Beta: 2+ machines with load balancing
3. Production: Add regions as needed

## MVP Scope (Internal Use)

### In Scope
- Auth: Email/password + Google OAuth
- Contacts: Full CRUD, search, filter by owner
- Companies: Full CRUD, link contacts
- Deals: Full CRUD, pipeline board view, stages (lead → qualified → proposal → negotiation → won/lost)
- Activities: Create tasks/calls/meetings, mark complete, link to contacts/deals
- Basic dashboard: Open deals, upcoming activities, recent contacts
- Team: Invite users by email, basic roles (admin/member)

### Out of Scope (Post-MVP)
- Calendar sync (Google Calendar) - first post-MVP feature
- Email integration
- Custom fields
- Automation/workflows
- Reporting/analytics
- Import/export
- Audit logs
- SSO/SAML
