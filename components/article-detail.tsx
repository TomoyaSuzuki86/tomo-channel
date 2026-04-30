import { ExternalLink, MessageCircle } from "lucide-react";
import Image from "next/image";
import { CategoryPill } from "@/components/category-pill";
import { formatDateTime } from "@/lib/format";
import type { Article } from "@/lib/types";

type ArticleDetailProps = {
  article: Article;
};

export function ArticleDetail({ article }: ArticleDetailProps) {
  return (
    <article className="rounded-lg border border-zinc-200 bg-white p-4 shadow-soft sm:p-6">
      <div className="flex flex-wrap items-center gap-3">
        <CategoryPill category={article.category} />
        <time className="text-sm font-bold text-zinc-500">{formatDateTime(article.publishedAt)}</time>
        <span className="inline-flex items-center gap-1 text-sm font-bold text-zinc-500">
          <MessageCircle className="h-4 w-4" />
          {article.comments.length}コメント
        </span>
      </div>

      <h1 className="mt-5 text-2xl font-black leading-relaxed text-zinc-950 sm:text-3xl">
        {article.title}
      </h1>

      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1.05fr)_minmax(260px,0.95fr)]">
        <Image
          alt=""
          className="aspect-video w-full rounded-md object-cover"
          height={720}
          priority
          src={article.thumbnailUrl}
          width={1280}
        />
        <div className="rounded-lg bg-zinc-50 p-4">
          <h2 className="mb-3 text-base font-black">3行まとめ</h2>
          <ol className="space-y-3">
            {article.summaryLines.map((line, index) => (
              <li className="grid grid-cols-[24px_1fr] gap-2 text-sm font-bold leading-7 text-zinc-700" key={line}>
                <span className="grid h-6 w-6 place-items-center rounded-full bg-tomo-pink text-xs text-white">
                  {index + 1}
                </span>
                <span>{line}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>

      <section className="mt-7 space-y-4">
        <h2 className="border-l-4 border-tomo-pink pl-3 text-xl font-black">本文解説</h2>
        {article.body.map((paragraph) => (
          <p className="text-base font-medium leading-9 text-zinc-800" key={paragraph}>
            {paragraph}
          </p>
        ))}
      </section>

      <section className="mt-7 rounded-lg border border-pink-100 bg-pink-50 p-4">
        <h2 className="text-lg font-black text-zinc-950">とも向けポイント</h2>
        <p className="mt-2 text-sm font-bold leading-7 text-zinc-700">{article.tomoPoint}</p>
      </section>

      <section className="mt-7 rounded-lg border border-zinc-200 p-4">
        <h2 className="text-lg font-black">なぜ大事？</h2>
        <p className="mt-2 text-sm font-medium leading-7 text-zinc-700">{article.whyItMatters}</p>
      </section>

      <section className="mt-7">
        <h2 className="text-lg font-black">出典リンク</h2>
        <ul className="mt-3 space-y-2">
          {article.sources.map((source) => (
            <li key={source.id}>
              <a
                className="inline-flex items-center gap-2 text-sm font-bold text-blue-700 hover:text-tomo-pink"
                href={source.url}
                rel="noreferrer"
                target="_blank"
              >
                {source.label}
                <ExternalLink className="h-4 w-4" />
              </a>
            </li>
          ))}
        </ul>
      </section>
    </article>
  );
}
