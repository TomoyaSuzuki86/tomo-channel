# OpenAI Reply Provider

`tomo-channel` can generate AI reply drafts with either the existing mock generator or OpenAI.
The UI, Firebase Hosting export, and n8n job flow stay the same.

## Environment variables

Set these in your local `.env`:

- `AI_REPLY_PROVIDER="mock"`: use the existing mock generator
- `AI_REPLY_PROVIDER="openai"`: call the OpenAI Responses API
- `OPENAI_API_KEY=""`: required only when the provider is `openai`
- `OPENAI_MODEL="gpt-5.4-mini"`: model name to use for OpenAI generation

`.env.example` includes all four values.

## How it works

1. `POST /api/comments` saves the user comment and queues an `AiReplyJob`.
2. The queued job stores the reply plan metadata in its payload, including the current provider choice.
3. `POST /api/jobs/process-ai-reply` reads that payload and generates reply drafts through the selected provider.
4. The generated replies are saved as `Comment` rows with:
   - `commentType = "ai"`
   - `aiGenerated = true`

The database still keeps user comments and AI comments separate.

## Mock provider

When `AI_REPLY_PROVIDER="mock"`, the app uses the existing local reply generator.
This is the safest default and is enough for local development, n8n testing, and Firebase-hosted UI checks.

## OpenAI provider

When `AI_REPLY_PROVIDER="openai"`, the app calls the Responses API and asks for JSON output with this shape:

```json
{
  "replyMode": "multi",
  "comments": [
    {
      "authorName": "名無しのエンジニア",
      "authorRole": "読者",
      "shortId": "engineer_42",
      "bodyLines": [
        ">>3",
        "これは実装目線だと、まず小さく試すのがよさそう。",
        "最初から自動化しすぎると原因追跡がきつい。"
      ]
    }
  ]
}
```

The processor normalizes the result so every AI reply includes `>>N` at the top if the model forgets to add it.

## Local test flow

1. Start PostgreSQL.
2. Start Next dev.
3. Seed the database.
4. Set `AI_REPLY_PROVIDER=openai`.
5. Set `OPENAI_API_KEY` to your local key.
6. Post a comment to queue a job.
7. Run `pnpm jobs:process-ai-reply` or trigger the n8n workflow.

If OpenAI fails, the job is marked `failed` and `lastError` is stored on `AiReplyJob`.

## Notes

- OpenAI is only used for reply draft generation.
- The app still stores final replies as normal `Comment` rows.
- Production deployment should keep the secret and API key out of the repo.
