# AGENTS.md

## Project

This project is `tomo-channel`.

It is a Japanese news/forum-style web app. The app shows daily news articles in a clean, modern matome-blog style. Users can read news summaries, view AI-generated forum-like comments, and post their own local comments in the first MVP.

Do not directly use real 2ch/5ch branding. Use original branding:

- ともちゃんねる
- とも速
- 朝刊ニュース板

## Primary Goal

Build an MVP web app with:

1. Top page with category cards and ranking sidebar
2. Article detail page with title, category, thumbnail image, 3-line summary, main explanation, source links, forum-style comments, and a comment form
3. AI-generated comments displayed with a small `AI` badge beside the short ID
4. User comments represented separately from AI comments in the data model
5. Clean responsive design for desktop and mobile

## Tech Stack

Use:

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- lucide-react
- pnpm

Later phases may add PostgreSQL and Prisma, but the first implementation uses static mock data only.

## UI Direction

The visual direction should be a Japanese matome/news-board site:

- White content cards
- Dark global navigation
- Pink accent color
- Forum-style comment rows
- Ranking sidebar
- Category tags
- Search box in header
- Article page with right sidebar on desktop
- Single-column layout on mobile

The design should feel like a modern, clean version of a matome blog. Do not make it too corporate or too childish.

## Important UX Requirements

- AI comments should feel natural and forum-like.
- AI comments must have a small, subtle `AI` badge.
- Do not add a large warning block inside every article.
- The data model must distinguish user comments and AI comments.
- The UI must support nested reply references such as `>>12`.
- Use compact comment metadata: display number, author name, timestamp, short ID, and AI badge if generated.

## Safety / Content Rules

Do not generate or implement features that:

- impersonate real users
- claim AI comments are real human comments
- copy real forum posts
- use real 2ch/5ch names as the official site name
- include defamation, discrimination, harassment, or unfounded claims
- create fake public opinion around products, politics, people, or companies

Forum-like tone is OK. Deception is not OK.

## Initial Implementation Scope

First implement static mock data only.

Create:

- `app/page.tsx`
- `app/articles/[slug]/page.tsx`
- components for header/nav/sidebar/article/comment
- mock data in `lib/mock-data.ts`
- shared types in `lib/types.ts`

Do not connect OpenAI or n8n in the first step. Do not implement authentication or real DB writes in the first step.

## Later Implementation Plan

After the static UI works:

1. Add Prisma and PostgreSQL
2. Add comment posting API
3. Add n8n webhook integration for AI replies
4. Add RSS/news ingestion workflow
5. Add article generation workflow

## Coding Guidelines

- Keep components small and readable.
- Use TypeScript types for `Article`, `Comment`, `Source`, and `Category`.
- Avoid overengineering.
- Favor simple server components where possible.
- Use client components only for interactive comment form and UI actions.
- Keep styling in Tailwind classes.
- Ensure mobile responsiveness.
- Run lint/build checks before finishing.
