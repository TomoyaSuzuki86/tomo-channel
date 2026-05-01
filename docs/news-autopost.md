# Morning News Autopost

This document describes the MVP workflow that can generate daily article candidates, turn them into tomo-channel article JSON, and submit them to the admin ingestion API.

## Overall Flow

```text
Schedule Trigger
  -> collect RSS/HTTP candidates
  -> normalize candidates by category
  -> generate article JSON with OpenAI
  -> POST /api/admin/articles
  -> if needed, sweep queued AI reply jobs
  -> return a summary
```

The first MVP covers these categories:

- `world`
- `japan`
- `it-trend`

The workflow is designed so each category can produce up to one article per run, for a total of up to three articles.

## Current Production Schedule

The current production setup is intentionally narrow:

- `it-trend` only is enabled
- `japan` is disabled
- `world` is disabled
- primary source is `GitHub Blog`
- schedule runs every day at `07:00 JST`
- the workflow stays under one article per run

Keep the workflow inactive until the manual run is green, then activate it in n8n.

## Required Environment Variables

Set these values in n8n:

- `APP_HOSTING_URL`
- `ADMIN_API_SECRET`
- `JOB_PROCESS_SECRET`
- `OPENAI_API_KEY`
- `OPENAI_MODEL`

The App Hosting URL should point to the dynamic backend, not static Firebase Hosting.

Example:

```text
APP_HOSTING_URL=https://tomo-channel--tomo-channel-app.asia-east1.hosted.app
```

## RSS URLs

The workflow ships with placeholder feed URLs so it is easy to import and edit.

Replace them with the real sources you want to use before enabling the schedule trigger.

Suggested placeholders:

- world: `https://example.com/rss/world.xml`
- japan: `https://example.com/rss/japan.xml`
- it-trend: `https://example.com/rss/it-trend.xml`

If a source is not available yet, keep the placeholder in the workflow and replace it later.

## Source Selection Policy

The workflow keeps a `sourceCandidates` array per category.

For the first production pass:

- `it-trend` is enabled
- `japan` is disabled until manual review is done
- `world` is disabled until manual review is done

The workflow should prefer these kinds of sources:

- RSS feeds from official blogs or news sites
- HTTP endpoints that return RSS or Atom
- manual fallback candidates only when a feed is not available yet

Avoid these areas in the first run:

- politics
- disasters
- medical claims
- incidents and crimes
- active conflicts

The category split is:

- `it-trend`: developer tools, platform updates, product engineering, and AI tooling
- `japan`: domestic IT, public digital policy, and everyday tech
- `world`: international tech, economy, and broad social trends

If a feed is not reliable or cannot be verified, keep it in `docs/news-sources.md` instead of hard-coding it as the active workflow source.

## Manual Verification

Before switching to daily automation, run the workflow manually once.

1. Start App Hosting and make sure the backend is healthy.
2. Confirm PostgreSQL is reachable.
3. Set `ADMIN_API_SECRET` and `JOB_PROCESS_SECRET` in n8n.
4. Import `n8n/workflows/morning-news-autopost.production.example.json`.
5. Replace the RSS URLs with real feeds or staging feeds.
6. Trigger the workflow manually.
7. Confirm `POST /api/admin/articles` returns `201` for new slugs.
8. Confirm duplicate slugs return `409` and are treated as a normal skip.
9. Confirm the article opens on the App Hosting URL.
10. If queued jobs exist, confirm the workflow can sweep them with `POST /api/jobs/process-ai-reply`.

## Switching to Daily Schedule

After a successful manual run:

1. Open the workflow in n8n.
2. Confirm the `Schedule Trigger` is set to `0 7 * * *`.
3. Confirm the workflow timezone is `Asia/Tokyo`.
4. Keep `it-trend` enabled and leave `japan` / `world` disabled.
5. Leave the workflow inactive until the last manual check is green.
6. Turn the workflow active once the article and comment pipeline are verified.

To stop the schedule, switch the workflow back to inactive in n8n. That is the fastest rollback if a generated article looks off.

## First Manual Run Notes

Record the first production-style manual run here so the next person can repeat it without guessing.

- Date: 2026-05-01
- Primary source: GitHub Blog
- Created slug: `the-github-blog-github-copilot-cli-beginners-interactive-vs-non-interactive`
- Article URL: https://tomo-channel--tomo-channel-app.asia-east1.hosted.app/articles/the-github-blog-github-copilot-cli-beginners-interactive-vs-non-interactive
- Admin API result: `201 Created` with `ok: true`, `sourceCount: 3`, and `initialEditorCommentCreated: true`
- AI reply sweep result: `POST /api/jobs/process-ai-reply` returned `200` with `processed: true` and `createdCommentCount: 1`
- Notes: Manual Trigger run succeeded on n8n execution `#12`; the article page loaded on App Hosting and the initial editor comment was present.

## Schedule Enable Notes

Add the first schedule activation details here once the daily run is turned on.

- Enabled date: 2026-05-02
- Run time: `07:00 JST`
- Enabled category: `it-trend`
- Primary source: `GitHub Blog`
- First schedule check: confirm the next morning's n8n execution history and the corresponding App Hosting article page
- Stop method: set the workflow back to inactive in n8n

## Conflict Handling

`409 Conflict` from `POST /api/admin/articles` is not an error in this workflow.

It means the article slug already exists, so the item should be skipped and summarized as a duplicate.

## Failure Checklist

If the workflow fails, check these first:

- `401 Unauthorized`: `ADMIN_API_SECRET` is wrong or missing.
- `500` from article creation: App Hosting cannot reach the database or the payload is invalid.
- `409 Conflict`: the slug already exists and the workflow should skip it.
- `OpenAI` failure: check `OPENAI_API_KEY`, `OPENAI_MODEL`, and the prompt output shape.
- `POST /api/jobs/process-ai-reply` returns `Unauthorized.`: `JOB_PROCESS_SECRET` is wrong.
- `processed:false` with no queued jobs: this is normal.
