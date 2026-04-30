"use client";

import { Search } from "lucide-react";
import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { ArticleCard } from "@/components/article-card";
import { contentCategories, getCategoryPath, searchArticles } from "@/lib/content";

export function SearchResults() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q")?.trim() ?? "";
  const results = useMemo(() => searchArticles(query), [query]);
  const visibleArticles = query ? results : results.slice(0, 4);

  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-4 shadow-soft sm:p-5">
      <div className="flex flex-col gap-4">
        <div>
          <p className="text-sm font-black text-tomo-pink">検索</p>
          <h1 className="mt-1 text-2xl font-black text-zinc-950">記事を探す</h1>
          <p className="mt-2 text-sm font-medium leading-7 text-zinc-600">
            タイトル、要約、本文、タグから記事を探せます。まずは気になる言葉を入れてみてください。
          </p>
        </div>

        <form action="/search" className="relative">
          <label className="sr-only" htmlFor="search-page-query">
            キーワードで検索
          </label>
          <input
            defaultValue={query}
            id="search-page-query"
            name="q"
            placeholder="キーワードで検索"
            className="h-12 w-full rounded-lg border border-zinc-200 bg-zinc-50 pl-4 pr-28 text-sm outline-none transition focus:border-tomo-pink focus:bg-white focus:ring-4 focus:ring-pink-100"
            type="search"
          />
          <button
            className="absolute right-2 top-1/2 inline-flex h-8 -translate-y-1/2 items-center gap-1 rounded-md bg-zinc-950 px-3 text-xs font-black text-white hover:bg-zinc-800"
            type="submit"
          >
            <Search className="h-4 w-4" />
            検索
          </button>
        </form>

        <div className="flex flex-wrap gap-2">
          {contentCategories.map((category) => (
            <a
              className="rounded-full border border-zinc-200 px-3 py-1.5 text-xs font-black text-zinc-700 hover:border-tomo-pink hover:text-tomo-pink"
              href={getCategoryPath(category)}
              key={category}
            >
              {category}
            </a>
          ))}
        </div>

        <div className="flex items-center justify-between border-t border-zinc-200 pt-4 text-sm font-bold text-zinc-500">
          <span>{query ? `「${query}」の検索結果` : "まずは新着記事を表示しています"}</span>
          <span>{visibleArticles.length}件</span>
        </div>
      </div>

      <div className="mt-4 space-y-4">
        {visibleArticles.map((article) => (
          <ArticleCard article={article} key={article.id} />
        ))}
      </div>
    </section>
  );
}
