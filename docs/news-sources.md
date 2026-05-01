# News Sources

This file lists the news source candidates for the morning autopost workflow.

## Operating Policy

- Start with `it-trend` only.
- Keep `japan` and `world` disabled until manual checks are done.
- Prefer RSS or Atom feeds over scraping.
- If a URL is uncertain, keep it here as a candidate and do not hard-code it in the workflow until it has been checked.
- Avoid politics, disasters, medical claims, crimes, and conflicts in the first stage of operation.

## Verified Feeds

These were checked by Codex on 2026-05-02 and returned RSS or Atom content:

### it-trend

- Hacker News: [https://news.ycombinator.com/rss](https://news.ycombinator.com/rss)
- GitHub Blog: [https://github.blog/feed/](https://github.blog/feed/)
- Cloudflare Blog: [https://blog.cloudflare.com/rss/](https://blog.cloudflare.com/rss/)
- TechCrunch: [https://techcrunch.com/feed/](https://techcrunch.com/feed/)
- The Verge: [https://www.theverge.com/rss/index.xml](https://www.theverge.com/rss/index.xml)
- OpenAI Blog: [https://openai.com/blog/rss.xml](https://openai.com/blog/rss.xml)

### japan

- Digital Agency: [https://www.digital.go.jp/rss/news.xml](https://www.digital.go.jp/rss/news.xml)
- NHK News: [https://www.nhk.or.jp/rss/news/cat0.xml](https://www.nhk.or.jp/rss/news/cat0.xml)
- ITmedia NEWS: [https://rss.itmedia.co.jp/rss/2.0/news_bursts.xml](https://rss.itmedia.co.jp/rss/2.0/news_bursts.xml)

### world

- BBC News: [https://feeds.bbci.co.uk/news/rss.xml](https://feeds.bbci.co.uk/news/rss.xml)
- The Guardian: [https://www.theguardian.com/world/rss](https://www.theguardian.com/world/rss)
- NPR: [https://feeds.npr.org/1001/rss.xml](https://feeds.npr.org/1001/rss.xml)

## Candidate URLs That Need Another Check

Keep these in the docs until the current feed URL is confirmed:

### it-trend

- Google Cloud Blog: `https://cloud.google.com/blog/rss.xml`
- Firebase Blog: `https://firebase.blog/feed.xml`

### japan

- Impress Watch: current RSS URL needs verification before enabling

### world

- Reuters: public RSS endpoint needs verification before enabling
- AP News: public RSS endpoint needs verification before enabling
- World Economic Forum: public RSS endpoint needs verification before enabling

## Suggested First Rollout

Only enable the `it-trend` category first.

Suggested order:

1. Hacker News
2. GitHub Blog
3. Cloudflare Blog
4. TechCrunch
5. The Verge
6. OpenAI Blog

If one feed is noisy or unstable, move it lower in the list or disable it.

## Notes

- The workflow uses `sourceCandidates` arrays so the active source can be swapped without rewriting the whole workflow.
- For non-RSS sources, keep the entry in the docs and only enable it after manual validation.
