# Firebase App Hosting

This project is currently deployed in two modes:

1. Firebase Hosting static export for the existing public site
2. Firebase App Hosting for the future dynamic Next.js + API + Prisma path

The two setups are intentionally kept separate so we do not break the current static site.

## What changed

- `apphosting.yaml` was added for the App Hosting backend
- `next.config.mjs` now switches between static export mode and App Hosting mode
- Firebase Hosting still uses `output: "export"`
- App Hosting does not use `output: "export"`

## How the switch works

`next.config.mjs` checks:

- `APP_HOSTING=true`
- `FIREBASE_APP_HOSTING=true`

When either is set, the app uses the App Hosting path and skips static export settings.
Otherwise it keeps the Firebase Hosting static export configuration.

## App Hosting environment variables

These are the variables we expect in the App Hosting backend:

- `APP_HOSTING=true`
- `DATABASE_URL`
- `JOB_PROCESS_SECRET`
- `AI_REPLY_PROVIDER`
- `OPENAI_API_KEY`
- `OPENAI_MODEL`

Suggested use:

- `DATABASE_URL`: Cloud SQL PostgreSQL connection string, provided as a secret
- `JOB_PROCESS_SECRET`: shared secret for `/api/jobs/process-ai-reply`
- `AI_REPLY_PROVIDER`: `mock` or `openai`
- `OPENAI_API_KEY`: required only when OpenAI replies are enabled
- `OPENAI_MODEL`: defaults to `gpt-5.4-mini`

`apphosting.yaml` already includes a safe starter layout for these values.

## Cloud SQL and VPC

App Hosting runs on Cloud Run, so the database connection needs to work from the runtime container.
For Cloud SQL, configure the backend so the App Hosting service can reach the PostgreSQL instance through VPC access.

The actual Cloud SQL instance, connector, and secret names are environment-specific.
Keep the live connection string in Secret Manager or the Firebase console, not in the repo.

## Build behavior

App Hosting should use the normal Next.js production build, but without the static export path.

Recommended behavior:

- Firebase Hosting static export: `next build` plus the existing export helper
- App Hosting: `next build` with `APP_HOSTING=true`

The export helper in `scripts/prepare-firebase-export.mjs` exits early when `APP_HOSTING=true`.

## n8n

When you move from local development to App Hosting, update the n8n HTTP Request node to point at the App Hosting domain instead of localhost.

Example:

```text
https://YOUR-APP-HOSTING-DOMAIN/api/jobs/process-ai-reply
```

Keep the same authentication header:

- `Authorization: Bearer <JOB_PROCESS_SECRET>`

The workflow JSON itself does not need to change.

## Local checklist

For the static site:

1. Leave `APP_HOSTING` unset.
2. Run `pnpm build`.
3. Firebase Hosting still writes to `out/`.

For the App Hosting path:

1. Set `APP_HOSTING=true`.
2. Run `pnpm build`.
3. Confirm `output: "export"` is not applied.
4. Use Cloud SQL, not the local Docker Postgres container.

## Notes

- `.env` and other secrets stay local.
- The existing Firebase Hosting deployment remains unchanged.
- This file is a preparation step, not a production rollout.
