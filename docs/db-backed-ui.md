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

The visible form is still local-state only in the static UI component.

The database write path already exists through:

```text
POST /api/comments
```

A later UI phase can switch the form from local state to this API after the Cloud SQL read path is stable.
