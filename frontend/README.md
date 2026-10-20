# Frontend

Next.js App Router frontend for the Project Submission and Review Dashboard.

## Local setup

```bash
cp .env.example .env.local
npm install
npm run dev
```

Open http://localhost:3000.

`NEXT_PUBLIC_API_URL` must point at the Express API (default `http://localhost:4000`).

## Scripts

- `npm run dev` — development server
- `npm run build` — production build
- `npm run start` — start production server
- `npm run lint` — ESLint

## Authentication notes

- Signup and login call `POST /api/auth/signup` and `POST /api/auth/login`.
- The API returns a Bearer JWT. The frontend stores it in `localStorage` and sends `Authorization: Bearer <token>`.
- HttpOnly cookie auth is not used because the backend does not set session cookies.
- Logout clears local auth state only; there is no backend logout endpoint.
- Client route guards are UX only. Backend JWT + RBAC remain authoritative.

## Student submissions

- Students submit via `POST /api/submissions` from `/student`.
- Client validation mirrors the backend Zod rules (required fields, HTTP/HTTPS URLs, length limits).
- Duplicate submissions return `409`; rate limits return `429`.
- There is no `GET /api/submissions/me`, so a reload cannot re-fetch the student's existing submission. The success view is session-local; a second POST still fails with `409`.
