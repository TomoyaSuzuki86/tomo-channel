# Operations Notes

This document tracks the minimum production operations checklist for App Hosting, Cloud SQL, n8n, and OpenAI.

## Current Runtime

- Static Firebase Hosting still serves the export build from `out/`.
- Firebase App Hosting serves dynamic Next.js routes and API routes.
- Cloud SQL PostgreSQL stores articles, comments, and AI reply jobs.
- n8n calls `POST /api/jobs/process-ai-reply`.
- OpenAI is used only by the server-side reply provider.

## Required Secrets

Keep these in Secret Manager or the Firebase App Hosting backend settings.

- `cloudsql_database_url`
- `job_process_secret`
- `openai_api_key`

Never commit `.env` or real secret values.

## Comment API Guardrails

`POST /api/comments` has lightweight runtime protections:

- maximum body length: 500 characters
- minimum body length: 2 characters
- maximum non-empty lines: 20
- whitespace-only comments are rejected
- repeated identical comments are rejected for a short window
- rapid repeat posting from the same client/article is rejected
- at most 5 comments per client/article per minute

These checks are in-memory and best-effort. They are suitable for the current MVP, but a distributed limiter such as Redis, Cloud Armor, or database-backed rate limits should replace them before higher traffic.

The browser never receives `JOB_PROCESS_SECRET`.

## Comment Refresh Flow

The browser may call:

```text
GET /api/comments?articleId=...
```

The browser must not call:

```text
POST /api/jobs/process-ai-reply
```

n8n or a trusted backend worker is responsible for job processing.

## n8n Workflow

Production example:

```text
n8n/workflows/process-ai-reply.production.example.json
```

Before importing it, replace:

- `<JOB_PROCESS_SECRET>`

The URL is currently:

```text
https://tomo-channel--tomo-channel-app.asia-east1.hosted.app/api/jobs/process-ai-reply
```

Expected responses:

```json
{"ok":true,"processed":true}
```

or:

```json
{"ok":true,"processed":false,"reason":"no-queued-job"}
```

## Deployment Checklist

1. Run `pnpm lint`.
2. Run `pnpm build`.
3. Run `APP_HOSTING=true pnpm build`.
4. Push `master`.
5. Create an App Hosting rollout for the target commit.
6. Confirm the App Hosting production rollout points at the target commit.
7. Check `GET /api/comments?articleId=cloud-article-001`.
8. Submit one UI comment.
9. Process one n8n job.
10. Confirm the UI refresh shows the AI reply.

## Failure Hints

- `Unauthorized.`: n8n secret header does not match `JOB_PROCESS_SECRET`.
- `no-queued-job`: API and DB are reachable, but there is no queued work.
- `relation "AiReplyJob" does not exist`: Cloud SQL is reachable but Prisma schema is missing.
- `Can't reach database server`: App Hosting VPC or Cloud SQL connectivity is not working.
- OpenAI provider failures should mark the job as `failed` with `lastError`.
