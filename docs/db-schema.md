# DB Schema Design

This document describes the Prisma schema direction for tomo-channel v0.4.0.

## Goals

- Keep the current static UI unchanged while preparing for a later DB-backed flow.
- Preserve the distinction between user comments and AI comments.
- Make it easy to connect a future `ai_reply_job` flow after comment posting.
- Keep article content and comment threads easy to seed from the current mock data.

## Model Overview

### Article

- Stores the public `slug` used by article detail pages.
- Keeps core article copy as structured content, including `summaryLines` and `body`.
- Holds lightweight metadata such as `category`, `publishedAt`, `thumbnailUrl`, and `viewCount`.

### ArticleSource

- Splits article sources into a separate table.
- Keeps source order stable with `sortOrder`.
- Allows multiple links per article without stuffing arrays into the main row.

### Comment

- Uses an internal `id` and a separate `displayNo`.
- Stores `commentType` as `user`, `ai`, or `editor`.
- Stores `aiGenerated` explicitly so the UI can keep AI disclosure simple.
- Stores `parentCommentId` and `replyToDisplayNo` so reply chains can be reconstructed later.
- Stores `replyMode` so the current reply-style mock can map directly to the future DB flow.

### AiReplyJob

- Represents the future bridge from a posted user comment to the AI reply workflow.
- Tracks the source comment, status, reply mode, and payload snapshot.
- Gives us a place to store n8n handoff state later without changing the comment table shape.

## Why This Shape

- The current UI already treats comments as a timeline with visible display numbers.
- AI replies are inserted after the user comment, so `displayNo` remains the user-facing ordering key.
- A separate job table keeps the future webhook pipeline out of the comment row itself.
- The schema stays close to the current TypeScript types, which reduces the chance of a later mismatch.

## Notes For The Next Phase

- `DATABASE_URL` will be required only when DB access is introduced.
- Prisma Client should remain isolated from the static UI until API routes are added.
- Seed data can mirror the current mock data until real ingestion exists.
