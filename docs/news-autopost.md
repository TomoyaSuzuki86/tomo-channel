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

1. Edit the schedule node in n8n.
2. Choose the local morning time you want.
3. Keep the RSS URLs and prompt settings stable.
4. Leave the workflow disabled until the first manual test is green.
5. Enable the workflow once the article and comment pipeline are verified.

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
