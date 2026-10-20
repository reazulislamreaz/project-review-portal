#!/bin/sh
set -e

echo "Applying Prisma migrations..."
npx prisma migrate deploy

if [ -n "${MENTOR_SEED_NAME:-}" ] && [ -n "${MENTOR_SEED_EMAIL:-}" ] && [ -n "${MENTOR_SEED_PASSWORD:-}" ]; then
  echo "Seeding mentor account..."
  npm run prisma:seed
else
  echo "Skipping mentor seed (set MENTOR_SEED_NAME, MENTOR_SEED_EMAIL, and MENTOR_SEED_PASSWORD to enable)."
fi

echo "Starting API server..."
exec npm start
