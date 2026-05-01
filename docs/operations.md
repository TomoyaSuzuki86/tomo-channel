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
- `admin_api_secret`
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

Morning autopost example:

```text
n8n/workflows/morning-news-autopost.production.example.json
```

Before importing it, replace:

- `<JOB_PROCESS_SECRET>`
- `<ADMIN_API_SECRET>`
- placeholder RSS URLs

The morning autopost workflow uses:

- `POST /api/admin/articles`
- `POST /api/jobs/process-ai-reply`

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

## Daily Autopost Checklist

Use this checklist when the morning autopost schedule is active:

1. Confirm the workflow is still active in n8n.
2. Confirm `it-trend` is the only enabled category.
3. Confirm the primary source is still `GitHub Blog`.
4. Check the most recent n8n execution for `201` or `409` on article creation.
5. If an article was created, confirm the App Hosting article page renders.
6. Confirm the AI reply sweep ended with either `processed:true` or `processed:false` and `no-queued-job`.
7. If anything looks suspicious, switch the workflow back to inactive first, then investigate.

## Failure Triage

Treat these statuses like this:

- `401` from `/api/admin/articles`: the admin secret is missing or wrong.
- `409` from `/api/admin/articles`: the slug already exists; skip it.
- `429` from `/api/comments`: the post guardrails blocked a repeat submission.
- `500` from `/api/admin/articles` or `/api/comments`: check App Hosting, Cloud SQL, and payload validation.
- `Unauthorized.` from `/api/jobs/process-ai-reply`: the job secret is missing or wrong.
- `processed:false` with `no-queued-job`: normal, no work was waiting.
- OpenAI failures should mark the job as failed and store `lastError`.

## Cost Checks

Watch these items during the first few days:

- OpenAI token usage for article generation
- OpenAI token usage for reply generation
- App Hosting request count and error rate
- Cloud SQL connection count and latency
- n8n execution count and failures

## Logs To Check

- App Hosting logs in the Firebase / Google Cloud console
- Cloud SQL logs in the Google Cloud console
- n8n execution history in the workflow editor
- OpenAI usage and API error logs in the OpenAI dashboard

## Failure Hints

- `Unauthorized.`: n8n secret header does not match `JOB_PROCESS_SECRET`.
- `no-queued-job`: API and DB are reachable, but there is no queued work.
- `relation "AiReplyJob" does not exist`: Cloud SQL is reachable but Prisma schema is missing.
- `Can't reach database server`: App Hosting VPC or Cloud SQL connectivity is not working.
- OpenAI provider failures should mark the job as `failed` with `lastError`.
- `409 Conflict` from article ingestion means the slug already exists and is safe to skip.
