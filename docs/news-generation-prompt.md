# News Generation Prompt

This prompt is used by the morning autopost workflow to turn feed candidates into one article JSON object that matches `POST /api/admin/articles`.

## Goal

Generate a compact Japanese news-board style article for tomo-channel.

The output must be a single JSON object and must follow this schema exactly:

```json
{
  "slug": "...",
  "title": "...",
  "category": "world | japan | it-trend",
  "publishedAt": "...",
  "summaryLines": ["...", "...", "..."],
  "bodyLines": ["...", "..."],
  "whyItMatters": "...",
  "tomoPoint": "...",
  "thumbnailUrl": "...",
  "tags": ["..."],
  "sources": [
    { "label": "...", "url": "..." }
  ],
  "initialEditorComment": {
    "bodyLines": ["..."],
    "authorName": "editor",
    "shortId": "editor"
  }
}
```

## Slug Rule

Use this format:

```text
YYYY-MM-DD-category-short-topic
```

Examples:

- `2026-05-02-it-trend-ai-workflow`
- `2026-05-02-world-supply-chain-update`

Rules:

- only ASCII letters, numbers, and hyphens
- lowercase is preferred
- keep the topic part short and readable
- do not include spaces or punctuation

## Style

- write in a modern bulletin-board summary style
- stay concise and readable
- use plain Japanese
- keep the article factual and calm
- the AI or forum flavor should come from the comment layer, not from sensational article text

## Safety Rules

Follow these rules strictly:

- do not add facts that are not supported by the provided sources
- do not turn speculation into a fact
- do not write defamatory or discriminatory content
- be careful with politics, disasters, medicine, and finance
- summarize from sources and keep the wording short
- do not copy real forum posts
- do not imitate real people or real journalists
- keep jokes light and harmless
- do not distort the news in the name of humor

## Output Expectations

- `summaryLines` should be 3 short lines
- `bodyLines` should usually be 2 to 4 lines
- `tags` should be short and topic-focused
- `thumbnailUrl` should be a valid image URL, preferably from a source or a safe placeholder chosen by the workflow
- `sources` must only contain URLs that were already provided by the candidate collection step
- `initialEditorComment` should be a short editor-style note

## Suggested Prompt Shape

System prompt:

> You are writing a short news-board article for tomo-channel. Return JSON only. Do not invent facts. Use only the sources provided. Keep the article concise, factual, and easy to scan.

User prompt:

> Create one article JSON object using the provided candidate sources, category, slug prefix, and date. Follow the exact schema. Use only the sources provided. The slug must start with the provided slug prefix.

