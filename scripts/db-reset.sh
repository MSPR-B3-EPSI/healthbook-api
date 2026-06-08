#!/usr/bin/env bash
set -euo pipefail

CONTAINER="healthai-healthbook-api-1"
WORKDIR="/workspace"

echo "==> Resetting healthbook DB inside $CONTAINER..."

docker exec "$CONTAINER" sh -c "
  set -e
  cd $WORKDIR

  echo '--> Dropping migration history and all tables...'
  npx prisma migrate reset --force --skip-generate 2>&1

  echo '--> Regenerating baseline migration from current schema...'
  rm -rf prisma/migrations
  mkdir -p prisma/migrations/0_init
  npx prisma migrate diff \
    --from-empty \
    --to-schema prisma/schema.prisma \
    --script > prisma/migrations/0_init/migration.sql 2>&1

  echo '--> Marking baseline as applied...'
  npx prisma migrate resolve --applied 0_init 2>&1

  echo '--> Status:'
  npx prisma migrate status 2>&1
"

echo "==> Done."
