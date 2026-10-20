# Project Submission and Review Dashboard

Monorepo for the Project Submission and Review Dashboard.

- `backend/` — Express.js + TypeScript API
- `frontend/` — Next.js + TypeScript web app

## Quick start with Docker

Prerequisites: Docker and Docker Compose.

```bash
git clone <repository-url>
cd <project-directory>
cp .env.example .env
docker compose up --build
```

Then open:

- Frontend: http://localhost:3000
- Backend health: http://localhost:4000/api/health

Stop the stack:

```bash
docker compose down
```

## Environment variables

Root `.env` (copied from `.env.example`) is used by Docker Compose:

| Variable | Default | Purpose |
|----------|---------|---------|
| `FRONTEND_PORT` | `3000` | Host port for the Next.js app |
| `BACKEND_PORT` | `4000` | Host port for the Express API |
| `NEXT_PUBLIC_API_URL` | `http://localhost:4000` | Browser-facing API base URL (baked into the frontend image at build time) |
| `CORS_ORIGIN` | `http://localhost:3000` | Allowed origin for backend CORS |

Optional local development without Docker:

- `backend/.env` — copy from `backend/.env.example`
- `frontend/.env.local` — copy from `frontend/.env.example`

Never commit real secrets. `.env` files are gitignored.

## Local development (without Docker)

Backend:

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

Frontend:

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

## Troubleshooting

- **Frontend cannot reach the API:** Confirm `NEXT_PUBLIC_API_URL` points to the host-accessible backend URL (`http://localhost:4000` by default), then rebuild: `docker compose up --build`.
- **Port already in use:** Change `FRONTEND_PORT` or `BACKEND_PORT` in `.env`.
- **Stale frontend API URL:** `NEXT_PUBLIC_*` values are applied at image build time. Rebuild after changing them.
- **Permission or Docker errors:** Ensure the Docker daemon is running and your user can access it.
