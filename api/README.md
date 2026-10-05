# CheckMate API

Fastify + PostgreSQL backend.

## Run locally

```bash
npm ci
npm run dev
```

Requires a PostgreSQL database (see `docker-compose.local.yml` at the repo root).

## Tests

Integration tests use `node:test` and run against a real PostgreSQL database
via `app.inject()` (no network ports).

Create the test database once:

```bash
psql -U postgres -c "CREATE USER checkmate WITH PASSWORD 'checkmate';"
psql -U postgres -c "CREATE DATABASE checkmate_test OWNER checkmate;"
```

Then run:

```bash
DATABASE_URL="postgres://checkmate:checkmate@localhost:5432/checkmate_test" \
TEST_DATABASE_URL="postgres://checkmate:checkmate@localhost:5432/checkmate_test" \
npm test
```

Tests run with `--test-concurrency=1` because all files share the same test
database; each file resets the database in its `before` hook and uses its own
username prefixes to avoid collisions.

Migrations from `src/migrations/` are applied automatically (idempotent, via
the `schema_migrations` table).
