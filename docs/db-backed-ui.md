# DB-backed UI

v1.5.0 connects the article detail UI to Cloud SQL comments on Firebase App Hosting while preserving the static Firebase Hosting export.

## Runtime Split

Static Firebase Hosting:

- `APP_HOSTING` is unset
- article pages are generated from `lib/mock-data.ts`
- no database connection is required

Firebase App Hosting:

- `APP_HOSTING=true`
- `DATABASE_URL` is available at runtime
- article detail pages resolve by slug from Cloud SQL
- comments are loaded from the `Comment` table through Prisma

## Fallback

If a database article is missing, the UI falls back to `lib/mock-data.ts`.

This is intentional during migration. It lets existing MVP article URLs continue to render while individual database-backed articles are introduced.

## Smoke Test Article

The App Hosting smoke test uses this database-backed article slug:

```text
cloud-api-smoke-test
```

Open it on the App Hosting domain:

```text
https://tomo-channel--tomo-channel-app.asia-east1.hosted.app/articles/cloud-api-smoke-test
```

Expected result:

- article detail renders from Cloud SQL
- comments include rows inserted by the App Hosting/n8n smoke test
- AI comments show the small `AI` badge
- Firebase Hosting static URLs continue to render from mock data

## Comment Posting

v1.6.0 connects the visible comment form to the database only in App Hosting mode.

Static Firebase Hosting:

- keeps the original local-state behavior
- does not call an API
- still shows temporary local user comments and mock AI reactions

Firebase App Hosting:

- passes `dbBackedMode` from the server-rendered article page
- posts the form body to `POST /api/comments`
- appends the returned `commentType=user` comment to the visible thread
- creates an `AiReplyJob` with `status=queued`
- shows a small inline error if the API request fails

The database write path is:

```text
POST /api/comments
```

AI reply processing is still separate. The form does not automatically call:

```text
POST /api/jobs/process-ai-reply
```

That endpoint is still triggered manually or by n8n.
