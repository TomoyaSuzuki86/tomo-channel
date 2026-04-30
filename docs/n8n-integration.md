# n8n Integration Notes

The AI reply job endpoint is now prepared for webhook-style calls from n8n.

## Example workflow

An importable example workflow lives at:

`n8n/workflows/process-ai-reply.example.json`

It uses the minimal pattern:

1. Manual Trigger
2. HTTP Request
3. `POST /api/jobs/process-ai-reply`

## Endpoint

`POST /api/jobs/process-ai-reply`

## Authentication

Set `JOB_PROCESS_SECRET` in your environment.

The endpoint accepts either of these headers:

- `Authorization: Bearer <JOB_PROCESS_SECRET>`
- `x-job-secret: <JOB_PROCESS_SECRET>`

If the secret is missing:

- in development, the endpoint allows requests and logs a warning
- in production, the endpoint returns `500`

If the secret is present and the header does not match, the endpoint returns `401`.

## n8n HTTP Request node

Recommended node settings:

- Method: `POST`
- URL: `http://host.docker.internal:3000/api/jobs/process-ai-reply` for local Docker-based n8n
- URL: your deployed `/api/jobs/process-ai-reply` when pointing at production or staging
- Authentication: none
- Headers:
  - `Authorization: Bearer {{$env.JOB_PROCESS_SECRET}}`
    or
  - `x-job-secret: {{$env.JOB_PROCESS_SECRET}}`
- Body: empty

In the example workflow JSON, the local-dev secret is written as a literal value
so Manual Trigger runs work even when the n8n expression sandbox blocks env
access:

- `Authorization: Bearer change-me-in-local-dev`

If you change `JOB_PROCESS_SECRET`, update the example workflow header to match.

If you run n8n in Docker on the same machine as Next dev, `host.docker.internal` is the easiest way to reach the local API.

## Import steps

1. Open n8n.
2. Use the workflow import menu.
3. Import `n8n/workflows/process-ai-reply.example.json`.
4. Set `JOB_PROCESS_SECRET` in the n8n runtime environment.
5. Confirm the HTTP Request node still points at the correct API base URL for your environment.

## Curl examples

```bash
curl -X POST "http://127.0.0.1:3000/api/jobs/process-ai-reply" \
  -H "Authorization: Bearer change-me-in-local-dev"
```

```bash
curl -X POST "http://127.0.0.1:3000/api/jobs/process-ai-reply" \
  -H "x-job-secret: change-me-in-local-dev"
```

## Behavior

- If a queued job exists, the endpoint processes one job and returns `processed: true`.
- If no queued job exists, the endpoint returns `processed: false`.
- The underlying worker still writes AI replies into `Comment` rows and marks the job `completed`.

## Local validation

Before testing the workflow locally, make sure:

- PostgreSQL is running with `docker compose up -d postgres`
- Next dev is running on port `3000`
- `pnpm db:seed` has been run so at least one `AiReplyJob` is queued
- `JOB_PROCESS_SECRET` is available to n8n and matches the API secret

Then either:

- run the example workflow in n8n with Manual Trigger, or
- send a test `curl` request against `POST /api/jobs/process-ai-reply`
