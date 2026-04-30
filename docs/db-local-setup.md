# Local DB Setup

This project stays static-first for the UI, but the DB schema and seed flow are ready for local PostgreSQL.

## What This Is For

- Keep the Firebase Hosting experience unchanged.
- Seed articles, comments, sources, and AI job rows into a local PostgreSQL database.
- Prepare the repository split for a later API layer without wiring the UI to the database yet.

## Prerequisites

- Docker Desktop or another Docker-compatible environment
- `pnpm`
- A local `.env` file copied from `.env.example`

## Quick Start

1. Start PostgreSQL.

```bash
docker compose up -d postgres
```

2. Copy the environment file and confirm `DATABASE_URL`.

```bash
copy .env.example .env
```

3. Generate Prisma Client.

```bash
pnpm db:generate
```

4. Create the initial schema in the local database.

```bash
pnpm exec prisma migrate dev --name init
```

5. Seed data from `lib/mock-data.ts`.

```bash
pnpm db:seed
```

6. Optionally inspect the database.

```bash
pnpm exec prisma studio
```

## Notes

- The UI still reads from `mock-data.ts` and local component state.
- `Article`, `Comment`, `ArticleSource`, and `AiReplyJob` remain aligned with the current TypeScript types.
- The seed script is intentionally separate from the runtime so Firebase Hosting export stays untouched.
