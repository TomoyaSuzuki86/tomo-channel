import { MessageCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { CategoryPill } from "@/components/category-pill";
import { formatShortDate } from "@/lib/format";
import type { Article } from "@/lib/types";

type ArticleCardProps = {
  article: Article;
  compact?: boolean;
};

export function ArticleCard({ article, compact = false }: ArticleCardProps) {
  return (
    <article className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-soft transition hover:-translate-y-0.5 hover:shadow-md">
      <Link href={`/articles/${article.slug}`} className={compact ? "block" : "grid md:grid-cols-[220px_1fr]"}>
        <Image
          alt=""
          className={compact ? "h-36 w-full object-cover" : "h-48 w-full object-cover md:h-full"}
          height={420}
          src={article.thumbnailUrl}
          width={720}
        />
        <div className="flex flex-col gap-3 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <CategoryPill category={article.category} />
            <time className="text-xs font-bold text-zinc-500">{formatShortDate(article.publishedAt)}</time>
          </div>
          <h2 className="text-lg font-black leading-relaxed text-zinc-950">{article.title}</h2>
          <p className="line-clamp-2 text-sm leading-7 text-zinc-600">{article.summaryLines[0]}</p>
          <div className="mt-auto flex flex-wrap items-center gap-2 text-xs font-bold text-zinc-500">
            <MessageCircle className="h-4 w-4" />
            <span>{article.comments.length || Math.max(18, Math.floor(article.viewCount / 210))}コメント</span>
            <span>{article.viewCount.toLocaleString("ja-JP")} views</span>
          </div>
        </div>
      </Link>
    </article>
  );
}
