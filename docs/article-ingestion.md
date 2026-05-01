# Article Ingestion API

`POST /api/admin/articles` creates one article, its sources, and an optional initial editor comment in Cloud SQL.

This endpoint is for n8n or trusted operators only.
It is not used by the browser UI.

## Authentication

Send the admin secret in the `Authorization` header:

```text
Authorization: Bearer <ADMIN_API_SECRET>
```

If the secret is missing in production, the API returns `500`.
If the secret is missing in local development, the API logs a warning and allows the request so the local workflow stays easy to test.

## Request Shape

Use JSON with the following fields:

```json
{
  "slug": "example-article-slug",
  "title": "Example article title",
  "category": "technology",
  "publishedAt": "2026-05-02T09:00:00+09:00",
  "summaryLines": ["Summary line 1", "Summary line 2", "Summary line 3"],
  "bodyLines": ["Body line 1", "Body line 2"],
  "whyItMatters": "Why this article matters.",
  "tomoPoint": "What readers should notice.",
  "thumbnailUrl": "https://example.com/thumb.jpg",
  "tags": ["news", "tech"],
  "sources": [
    {
      "label": "Source label",
      "url": "https://example.com/source"
    }
  ],
  "initialEditorComment": {
    "bodyLines": ["Editor note line 1", "Editor note line 2"],
    "authorName": "editor",
    "shortId": "editor"
  }
}
```

`summaryLines` and `bodyLines` are stored as arrays of text lines.
`sources` is required and must contain at least one item.

## Validation

The API rejects:

- slugs with characters other than letters, numbers, and hyphens
- missing or empty titles
- invalid categories
- missing sources
- invalid URLs
- overlong summary/body fields
- duplicate slugs

## Responses

- `201 Created` when the article is stored successfully
- `401 Unauthorized` when the bearer token is wrong
- `409 Conflict` when the slug already exists
- `400 Bad Request` for invalid JSON or validation errors

## Example curl

```bash
curl -X POST "https://<App Hosting URL>/api/admin/articles" \
  -H "Authorization: Bearer <ADMIN_API_SECRET>" \
  -H "Content-Type: application/json" \
  --data '{
    "slug":"example-article-slug",
    "title":"Example article title",
    "category":"technology",
    "publishedAt":"2026-05-02T09:00:00+09:00",
    "summaryLines":["Summary line 1","Summary line 2","Summary line 3"],
    "bodyLines":["Body line 1","Body line 2"],
    "whyItMatters":"Why this article matters.",
    "tomoPoint":"What readers should notice.",
    "thumbnailUrl":"https://example.com/thumb.jpg",
    "tags":["news","tech"],
    "sources":[
      {
        "label":"Source label",
        "url":"https://example.com/source"
      }
    ],
    "initialEditorComment":{
      "bodyLines":["Editor note line 1","Editor note line 2"]
    }
  }'
```

## Notes

- The browser UI does not call this endpoint.
- RSS ingestion and OpenAI generation are not part of this endpoint yet.
- Use n8n or a trusted admin script to post article payloads.
