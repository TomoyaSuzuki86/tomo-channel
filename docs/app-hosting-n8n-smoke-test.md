# App Hosting n8n Smoke Test

This note records the v1.3.0 smoke test path:

```text
n8n Manual Trigger
-> Firebase App Hosting API Route
-> Cloud SQL PostgreSQL
-> queued AiReplyJob is processed
-> AI Comment rows are inserted
```

The test keeps `AI_REPLY_PROVIDER=mock`. OpenAI production use is a later phase.

## Confirmed Environment

- Firebase project: `tomo-channel-app`
- App Hosting backend: `tomo-channel`
- App Hosting region: `asia-east1`
- App Hosting URL: `https://tomo-channel--tomo-channel-app.asia-east1.hosted.app`
- Cloud SQL instance: `tomo-channel-sql`
- Cloud SQL private IP: `10.33.0.3`
- Cloud SQL database: `tomo_channel`
- VPC connector: `projects/tomo-channel-app/locations/asia-east1/connectors/tomo-channel-connector`
- AI reply provider: `mock`

## Required Secrets

Store these outside the repository.

- `cloudsql_database_url`: PostgreSQL connection string for Cloud SQL
- `job_process_secret`: shared secret for the job processing endpoint
- `openai_api_key`: optional until `AI_REPLY_PROVIDER=openai`

`apphosting.yaml` maps those secrets into runtime environment variables.

## VPC Configuration

`vpcAccess` must be nested under `runConfig`.

```yaml
runConfig:
  cpu: 1
  memoryMiB: 512
  concurrency: 80
  vpcAccess:
    connector: projects/tomo-channel-app/locations/asia-east1/connectors/tomo-channel-connector
    egress: PRIVATE_RANGES_ONLY
```

If `vpcAccess` is placed at the top level, the rollout can still build, but runtime DB access may fail with:

```text
Can't reach database server at `10.33.0.3:5432`
```

## Cloud SQL Bootstrap

The App Hosting runtime reaches Cloud SQL through private networking. A local machine usually cannot connect directly to the private IP.

For the first bootstrap, use Cloud SQL import:

1. Create the database if needed.
2. Generate SQL from the Prisma schema.
3. Upload the SQL file to a temporary Cloud Storage bucket.
4. Grant the Cloud SQL service account read access to that bucket.
5. Import the SQL into Cloud SQL.

Example commands:

```bash
gcloud sql databases create tomo_channel \
  --instance=tomo-channel-sql \
  --project=tomo-channel-app
```

```bash
pnpm exec prisma migrate diff \
  --from-empty \
  --to-schema-datamodel prisma/schema.prisma \
  --script > tomo-channel-cloudsql-schema.sql
```

```bash
gcloud storage cp tomo-channel-cloudsql-schema.sql \
  gs://tomo-channel-app-sql-import/tomo-channel-cloudsql-schema.sql \
  --project=tomo-channel-app
```

```bash
gcloud sql import sql tomo-channel-sql \
  gs://tomo-channel-app-sql-import/tomo-channel-cloudsql-schema.sql \
  --database=tomo_channel \
  --project=tomo-channel-app
```

If the import fails with a bucket permission error, grant the Cloud SQL instance service account `roles/storage.objectViewer` on the import bucket.

## API Checks

Unauthenticated requests should return `401`.

```bash
curl -X POST \
  "https://tomo-channel--tomo-channel-app.asia-east1.hosted.app/api/jobs/process-ai-reply"
```

Expected:

```json
{"ok":false,"processed":false,"error":"Unauthorized."}
```

Authenticated requests should return either `processed:true` or `no-queued-job`.

```bash
curl -X POST \
  "https://tomo-channel--tomo-channel-app.asia-east1.hosted.app/api/jobs/process-ai-reply" \
  -H "Authorization: Bearer <JOB_PROCESS_SECRET>"
```

Expected with no queued jobs:

```json
{"ok":true,"processed":false,"reason":"no-queued-job"}
```

Expected with a queued job:

```json
{
  "ok": true,
  "processed": true,
  "createdCommentCount": 1
}
```

## Create A Queued Job

Use the deployed comment API to create a user comment and a queued `AiReplyJob`.

```bash
curl -X POST \
  "https://tomo-channel--tomo-channel-app.asia-east1.hosted.app/api/comments" \
  -H "Content-Type: application/json" \
  --data '{
    "articleId": "cloud-article-001",
    "body": "n8nからApp Hosting APIを呼ぶ確認です。"
  }'
```

Then run the n8n workflow or call the process endpoint directly.

## n8n Workflow

Use this workflow as the App Hosting example:

```text
n8n/workflows/process-ai-reply.app-hosting.example.json
```

Before importing it, replace:

- `<APP_HOSTING_URL>` with the deployed App Hosting URL
- `<JOB_PROCESS_SECRET>` with the runtime secret

HTTP Request node settings:

- Method: `POST`
- URL: `https://tomo-channel--tomo-channel-app.asia-east1.hosted.app/api/jobs/process-ai-reply`
- Authentication: none
- Header: `Authorization: Bearer <JOB_PROCESS_SECRET>`
- Body: empty

## Confirmed v1.3.0 Result

The smoke test passed with:

- unauthenticated POST returned `401`
- authenticated POST returned `200`
- `AiReplyJob` changed from `queued` to `completed`
- AI comments were inserted into `Comment`
- final repeat call returned `processed:false` and `reason:no-queued-job`

## Next Phase

After this is stable, the safe next steps are:

1. Switch App Hosting to `AI_REPLY_PROVIDER=openai`
2. Verify one OpenAI-generated reply through n8n
3. Connect the UI to Cloud SQL-backed article and comment reads
