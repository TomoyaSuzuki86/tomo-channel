# AI Reply Job Flow

This project keeps the UI static-first, but the database already models the reply pipeline that will later be driven by n8n or OpenAI.

## Current mock flow

1. A user comment is posted through `POST /api/comments`.
2. The API saves the user comment with `commentType = user`.
3. The API creates one `AiReplyJob` row with `status = queued`.
4. `pnpm jobs:process-ai-reply` claims one queued job.
5. The processor marks the job as `sending`.
6. The processor builds mock reply drafts from the source comment body.
7. The processor inserts `Comment` rows with `commentType = ai` and `aiGenerated = true`.
8. The processor marks the job as `completed`.

## Failure handling

If processing fails after a job is claimed, the script marks the job as `failed` and stores `lastError`.

## Concurrency notes

- Only rows with `status = queued` are eligible for processing.
- The claim step uses a row-level lock so another worker does not take the same job.
- The comment insert step uses the article's next `displayNo` inside a transaction.

## Local command

```bash
pnpm jobs:process-ai-reply
```

If no queued job exists, the script exits successfully without changing the database.

## Local database URL

For local development, the job processor can fall back to the Docker Compose PostgreSQL URL when `DATABASE_URL` is not set.
This keeps the script and local API route easy to run during development, while `.env` remains uncommitted.

## Future swap points

- Replace the mock reply generation with n8n or OpenAI.
- Keep the `AiReplyJob` lifecycle the same.
- Keep `Comment` rows as the final storage target for AI responses.
