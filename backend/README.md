# Backend

Express.js + TypeScript API for the Project Submission and Review Dashboard.

## Setup

```bash
cp .env.example .env
# Set DATABASE_URL, JWT_SECRET, MENTOR_SEED_*
npm install
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run dev
```

Health check: `GET http://localhost:4000/api/health`

## Tests

```bash
cp .env.test.example .env.test
# DATABASE_URL must point at a database whose name ends with _test
npm test
```

Destructive cleanup runs only against `*_test` databases.

## Scripts

See the root `README.md` for the full command list and API reference.

## Docker

The image entrypoint runs `prisma migrate deploy`, optionally seeds the mentor account, then starts the server. Configure seed credentials via Compose environment variables.
