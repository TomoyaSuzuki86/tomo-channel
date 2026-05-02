import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { ArticleCard } from "@/components/article-card";
import { RankingSidebar } from "@/components/ranking-sidebar";
import { groupArticlesByDayForDisplay } from "@/lib/content";

export const dynamic = "force-dynamic";

export default async function ArchivePage() {
  const groups = await groupArticlesByDayForDisplay();

  return (
    <main className="mx-auto grid max-w-7xl gap-5 px-4 py-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="space-y-5">
        <section className="rounded-lg border border-zinc-200 bg-white p-4 shadow-soft sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-black text-tomo-pink">日付アーカイブ</p>
              <h1 className="mt-1 text-2xl font-black text-zinc-950">過去の記事を日付でたどる</h1>
              <p className="mt-2 text-sm font-medium leading-7 text-zinc-600">
                新着順で記事を並べ、あとから読み返しやすいように日付ごとにまとめています。
              </p>
            </div>
            <Link
              className="inline-flex h-10 items-center gap-2 rounded-md border border-zinc-200 px-4 text-sm font-black text-zinc-700 hover:bg-zinc-50"
              href="/search"
              prefetch={false}
            >
              <CalendarDays className="h-4 w-4" />
              検索ページ
            </Link>
          </div>
        </section>

        <section className="space-y-5">
          {groups.map((group) => (
            <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-soft sm:p-5" key={group.dateKey}>
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-black text-tomo-pink">アーカイブ</p>
                  <h2 className="text-xl font-black text-zinc-950">{group.label}</h2>
                </div>
                <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-black text-zinc-600">
                  {group.articles.length}件
                </span>
              </div>
              <div className="space-y-4">
                {group.articles.map((article) => (
                  <ArticleCard article={article} key={article.id} />
                ))}
              </div>
            </div>
          ))}
        </section>
      </div>

      <RankingSidebar />
    </main>
  );
}
