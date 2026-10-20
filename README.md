# Project Submission and Review Dashboard

Full-stack monorepo for the Associate Web Instructor hiring assignment (Part 1 — application).

| Path | Stack |
|------|--------|
| `backend/` | Express.js, TypeScript, Prisma, PostgreSQL, JWT RBAC |
| `frontend/` | Next.js App Router, TypeScript, Tailwind CSS, shadcn-style UI |

Part 2 teaching videos are separate deliverables and are not included in this repository.

## Prerequisites

- Node.js 18+ (20 recommended)
- npm
- Docker and Docker Compose (recommended), **or** a local PostgreSQL 16 instance

## Quick start (Docker)

```bash
git clone <repository-url>
cd <project-directory>
cp .env.example .env
```

Edit `.env` and set at least:

- `JWT_SECRET` — long random string, **32+ characters** (required; Compose will not start without it)
- `MENTOR_SEED_PASSWORD` — strong password for the seeded mentor account (recommended)

Then:

```bash
docker compose up --build
```

On backend startup the container:

1. Applies Prisma migrations (`prisma migrate deploy`)
2. Seeds the mentor account when `MENTOR_SEED_NAME`, `MENTOR_SEED_EMAIL`, and `MENTOR_SEED_PASSWORD` are all set
3. Starts the API

Open:

- Frontend: http://localhost:3000
- Backend health: http://localhost:4000/api/health

Stop:

```bash
docker compose down
```

## Local development (without full Compose app stack)

### 1. Database

Start PostgreSQL only (example):

```bash
docker compose up -d postgres
```

Or point `DATABASE_URL` at any local Postgres database.

### 2. Backend

```bash
cd backend
cp .env.example .env
# Edit DATABASE_URL, JWT_SECRET, and mentor seed values
npm install
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run dev
```

API: http://localhost:4000

### 3. Frontend

```bash
cd frontend
cp .env.example .env.local
# NEXT_PUBLIC_API_URL=http://localhost:4000
npm install
npm run dev
```

App: http://localhost:3000

## Environment variables

### Root `.env` (Docker Compose)

| Variable | Required | Purpose |
|----------|----------|---------|
| `JWT_SECRET` | Yes | Signing key for JWTs (32+ chars in production) |
| `JWT_EXPIRES_IN` | No | Access token lifetime (default `24h`) |
| `MENTOR_SEED_NAME` | For seed | Seeded mentor display name |
| `MENTOR_SEED_EMAIL` | For seed | Seeded mentor email |
| `MENTOR_SEED_PASSWORD` | For seed | Seeded mentor password |
| `DATABASE_URL` | Yes (Compose) | Postgres URL used by the backend container |
| `NEXT_PUBLIC_API_URL` | No | Browser API base URL baked into the frontend image |
| `CORS_ORIGIN` | No | Allowed browser origin for the API |
| `FRONTEND_PORT` / `BACKEND_PORT` / `POSTGRES_*` | No | Host ports and DB defaults |

Never commit real secrets. `.env`, `backend/.env`, and `frontend/.env.local` are gitignored.

Frontend public env may only include `NEXT_PUBLIC_API_URL`. Do **not** put `JWT_SECRET` in frontend env.

### Backend test env

```bash
cd backend
cp .env.test.example .env.test
```

`DATABASE_URL` for tests **must** use a database name ending in `_test`. Tests refuse other databases.

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
| `/student` | STUDENT | Student dashboard (submit + status + timeline) |
| `/student/profile` | STUDENT | Student profile (name, email, role, member since) |
| `/mentor` | MENTOR | Review dashboard |

## API overview

Base URL: `http://localhost:4000` (or `NEXT_PUBLIC_API_URL`).

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| `GET` | `/api/health` | No | Liveness |
| `POST` | `/api/auth/signup` | No | Student signup |
| `POST` | `/api/auth/login` | No | Returns `{ user, token }` |
| `GET` | `/api/auth/me` | Bearer | Current user profile |
| `POST` | `/api/submissions` | Student | Create submission |
| `GET` | `/api/submissions/me` | Student | Own submission (incl. `feedback`, `reviewedAt`), or `{ submission: null }` |
| `GET` | `/api/submissions` | Mentor | List + `page`, `limit`, optional `status`, `q`, `sortBy=createdAt`, `sortOrder=asc\|desc` |
| `PATCH` | `/api/submissions/:id/status` | Mentor | `{ status: APPROVED \| REJECTED, feedback?: string \| null }` |
| `GET` | `/api/dashboard/stats` | Mentor | Aggregate counts |

There is no Swagger/OpenAPI UI in this project.

Authenticated requests use:

```http
Authorization: Bearer <jwt>
```

## Design decisions (assignment ambiguities)

- **Duplicate submissions:** one submission per student (`unique studentId`); second create returns `409`.
- **Roles:** `STUDENT` and `MENTOR` (seeded mentor acts as admin/reviewer).
- **Rate limit:** in-memory, 5 submission attempts / 15 minutes per authenticated student (process-local).
- **Mentor feedback:** optional; empty/whitespace feedback is stored as `null`. Max 2000 characters. Saved atomically with status + `reviewedAt`.
- **Timeline timestamps:** `createdAt` = submitted; `reviewedAt` = mentor decision time (null while `PENDING`).
- **Token storage (frontend):** Bearer JWT in `localStorage` (XSS-sensitive). The backend does not issue HttpOnly session cookies; changing that would require an auth contract change.

## Troubleshooting

- **Compose exits on JWT_SECRET:** set a non-empty `JWT_SECRET` in root `.env`.
- **Production JWT_SECRET rejected:** must be ≥32 characters and must not look like a placeholder (`change-me`, `replace-with`, etc.).
- **Frontend cannot reach API:** check `NEXT_PUBLIC_API_URL`, then rebuild frontend (`docker compose up --build`).
- **Empty mentor login:** ensure seed variables are set and the backend container logged a successful seed.
- **Test DB refused:** configure `backend/.env.test` so `DATABASE_URL` ends with `_test`.
- **Port in use:** change `FRONTEND_PORT` / `BACKEND_PORT` / `POSTGRES_PORT` in `.env`.

## Submission checklist (assignment)

1. Make the GitHub repository **public** after the submission deadline (per the PDF).
2. Ensure the README and `.env.example` files are enough to run the app.
3. Submit the repository link (and Part 2 video links separately).

This audit does not create or claim completion of Part 2 videos.
