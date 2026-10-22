# Project Submission and Review Dashboard

## Overview

Students sign up, submit a project, and track review status. Mentors review submissions, approve or reject them with feedback, and view stats. Students can resubmit after rejection.

| Path | Stack |
|------|--------|
| `backend/` | Express.js, TypeScript, Prisma, PostgreSQL, JWT RBAC |
| `frontend/` | Next.js App Router, TypeScript, Tailwind CSS |

## Live demo

- **Frontend:** https://task.elevateapparel.com.bd
- **API:** https://taskapi.elevateapparel.com.bd
- **API health:** https://taskapi.elevateapparel.com.bd/api/health

Demo mentor (seeded): use the **Demo mentor login** button on the login page, or sign in with the mentor email/password from your `.env` seed values.

## Prerequisites

- Node.js 18+ (20 recommended) and npm
- Docker and Docker Compose (recommended), **or** a local PostgreSQL 16 instance

## Project setup

### Option A — Docker (recommended)

```bash
git clone <repository-url>
cd <project-directory>
cp .env.example .env
```

Edit `.env` and set:

1. `JWT_SECRET` — random string, **32+ characters** (required)
2. `MENTOR_SEED_PASSWORD` — password for the seeded mentor account
3. Leave local defaults for ports and URLs, or change them for your host

Then build and start:

```bash
docker compose up --build
```

On startup the backend applies migrations, seeds the mentor (when seed vars are set), and starts the API.

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend health | http://localhost:4000/api/health |

Stop:

```bash
docker compose down
```

### Option B — Local development

**1. Database**

```bash
docker compose up -d postgres
```

Or set `DATABASE_URL` to any local Postgres database.

**2. Backend**

```bash
cd backend
cp .env.example .env
# Set DATABASE_URL, JWT_SECRET, MENTOR_SEED_*
npm install
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run dev
```

API: http://localhost:4000

**3. Frontend**

```bash
cd frontend
cp .env.example .env.local
# Ensure NEXT_PUBLIC_API_URL=http://localhost:4000
npm install
npm run dev
```

App: http://localhost:3000

## Environment variables

### Root `.env` (Docker Compose)

| Variable | Required | Purpose |
|----------|----------|---------|
| `JWT_SECRET` | Yes | JWT signing key (32+ chars in production) |
| `JWT_EXPIRES_IN` | No | Token lifetime (default `24h`) |
| `MENTOR_SEED_NAME` | For seed | Seeded mentor display name |
| `MENTOR_SEED_EMAIL` | For seed | Seeded mentor email |
| `MENTOR_SEED_PASSWORD` | For seed | Seeded mentor password |
| `DATABASE_URL` | Yes (Compose) | Postgres URL for the backend container |
| `NEXT_PUBLIC_API_URL` | No | Browser API base URL (baked into frontend image) |
| `CORS_ORIGIN` | No | Allowed browser origin (must match the frontend URL) |
| `FRONTEND_PORT` / `BACKEND_PORT` / `POSTGRES_*` | No | Host ports and DB defaults |

Never commit real secrets. `.env`, `backend/.env`, and `frontend/.env.local` are gitignored.

Do **not** put `JWT_SECRET` in frontend env — only `NEXT_PUBLIC_API_URL`.

### Backend test env

```bash
cd backend
cp .env.test.example .env.test
```

`DATABASE_URL` for tests **must** end with `_test`.

## Useful commands

### Backend (`backend/`)

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start API with reload |
| `npm run build` / `npm start` | Production build and run |
| `npm run typecheck` | TypeScript check |
| `npm test` | Vitest suite (uses `.env.test`) |
| `npm run prisma:validate` | Validate Prisma schema |
| `npm run prisma:generate` | Generate Prisma Client |
| `npm run prisma:migrate` | Create/apply migrations (dev) |
| `npm run prisma:seed` | Seed mentor/admin account |

### Frontend (`frontend/`)

| Command | Purpose |
|---------|---------|
| `npm run dev` | Next.js development server |
| `npm run build` / `npm start` | Production build and run |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript check |

## Application routes

| Route | Role | Purpose |
|-------|------|---------|
| `/` | Public | Landing / redirect |
| `/signup` | Public | Student registration |
| `/login` | Public | Student or mentor login |
| `/student` | STUDENT | Dashboard (submit, status, timeline) |
| `/student/profile` | STUDENT | Profile (email read-only) |
| `/mentor` | MENTOR | Review dashboard |
| `/mentor/submissions/[id]` | MENTOR | Submission detail / review |
| `/mentor/profile` | MENTOR | Profile (email read-only) |

## API overview

Base URL: `http://localhost:4000` (or `NEXT_PUBLIC_API_URL`).

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| `GET` | `/api/health` | No | Liveness |
| `POST` | `/api/auth/signup` | No | Student signup |
| `POST` | `/api/auth/login` | No | Returns `{ user, token }` |
| `POST` | `/api/auth/demo-mentor` | No | Demo mentor login (server-side seed creds) |
| `GET` | `/api/auth/me` | Bearer | Current user profile |
| `PATCH` | `/api/auth/me` | Bearer | Update own profile (`name` only) |
| `POST` | `/api/submissions` | Student | Create submission (`PENDING`) |
| `GET` | `/api/submissions/me` | Student | Own submission, or `{ submission: null }` |
| `PATCH` | `/api/submissions/me` | Student | Resubmit after `REJECTED` → `PENDING` |
| `GET` | `/api/submissions` | Mentor | List + filters/pagination |
| `GET` | `/api/submissions/:id` | Mentor | Submission detail |
| `PATCH` | `/api/submissions/:id/status` | Mentor | Approve / reject + optional feedback |
| `GET` | `/api/dashboard/stats` | Mentor | Aggregate counts |

Authenticated requests:

```http
Authorization: Bearer <jwt>
```

## Design decisions

- **One submission per student** (`unique studentId`); second create returns `409`.
- **Lifecycle:** `PENDING` / `APPROVED` locked for students; `REJECTED` can be updated via `PATCH /api/submissions/me` (status back to `PENDING`; prior feedback kept in `previousFeedback`).
- **Roles:** `STUDENT` and `MENTOR`.
- **Rate limit:** 5 submission attempts / 15 minutes per student (in-memory).
- **Mentor feedback:** optional, max 2000 chars; empty stored as `null`.
- **Frontend auth:** JWT in `localStorage`.

## Troubleshooting

- **Compose exits on JWT_SECRET:** set a non-empty `JWT_SECRET` in root `.env`.
- **Production JWT_SECRET rejected:** must be ≥32 characters and not a placeholder.
- **Frontend cannot reach API:** check `NEXT_PUBLIC_API_URL`, then rebuild (`docker compose up --build`).
- **CORS / blocked requests:** set `CORS_ORIGIN` to the exact frontend origin (scheme + host + port), then recreate the backend container.
- **Empty mentor login:** ensure seed variables are set and the backend logged a successful seed.
- **Test DB refused:** `DATABASE_URL` in `backend/.env.test` must end with `_test`.
- **Port in use:** change `FRONTEND_PORT` / `BACKEND_PORT` / `POSTGRES_PORT` in `.env`.
