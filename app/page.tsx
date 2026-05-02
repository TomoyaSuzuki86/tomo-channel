import { ArticleCard } from "@/components/article-card";
import { RankingSidebar } from "@/components/ranking-sidebar";
import Link from "next/link";
import { contentCategories, getArticlesForDisplay, getCategoryPath } from "@/lib/content";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const articles = await getArticlesForDisplay(20);
  const featured = articles[0];
  const categoryArticles = articles.slice(0, 6);

  return (
    <main className="mx-auto grid max-w-7xl gap-5 px-4 py-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="space-y-5">
        <section className="rounded-lg border border-zinc-200 bg-white p-4 shadow-soft sm:p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-black text-tomo-pink">朝刊ニュース板</p>
              <h1 className="mt-1 text-2xl font-black leading-tight text-zinc-950 sm:text-3xl">
                今日の話題を、ともに読める形で。
              </h1>
            </div>
            <span className="hidden rounded-full bg-zinc-950 px-4 py-2 text-xs font-black text-white sm:inline-flex">
              現代版まとめサイト
            </span>
          </div>
          <ArticleCard article={featured} />
        </section>

        <section className="rounded-lg border border-zinc-200 bg-white p-4 shadow-soft sm:p-5">
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <p className="text-sm font-black text-tomo-pink">探す</p>
              <h2 className="text-xl font-black">カテゴリで読む</h2>
            </div>
            <Link className="text-sm font-black text-zinc-500 hover:text-tomo-pink" href="/search">
              検索ページへ
            </Link>
          </div>
          <div className="flex flex-wrap gap-2">
            {contentCategories.map((category) => (
              <Link
                className="rounded-full border border-zinc-200 px-4 py-2 text-sm font-black text-zinc-700 hover:border-tomo-pink hover:text-tomo-pink"
                href={getCategoryPath(category)}
                key={category}
                prefetch={false}
              >
                {category}
              </Link>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-zinc-200 bg-white p-4 shadow-soft sm:p-5">
          <div className="mb-4 flex items-end justify-between">
            <div>
              <p className="text-sm font-black text-tomo-pink">カテゴリ別</p>
              <h2 className="text-xl font-black">話題のカード</h2>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {categoryArticles.map((article) => (
              <div key={article.id}>
                <div className="mb-2 text-sm font-black text-zinc-500">{article.category}</div>
                <ArticleCard article={article} compact />
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-zinc-200 bg-white p-4 shadow-soft sm:p-5">
          <div className="mb-4">
            <p className="text-sm font-black text-tomo-pink">とも速</p>
            <h2 className="text-xl font-black">新着記事</h2>
          </div>
          <div className="space-y-4">
            {articles.slice(1).map((article) => (
              <ArticleCard article={article} key={article.id} />
            ))}
          </div>
        </section>
      </div>

      <RankingSidebar />
    </main>
  );
}
