import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Search } from "lucide-react";
import { ArticleCard } from "@/components/article-card";
import { RankingSidebar } from "@/components/ranking-sidebar";
import {
  contentCategories,
  getArticlesByCategoryForDisplay,
  getCategoryLabelFromSlug,
  getCategoryPath
} from "@/lib/content";

type CategoryPageProps = {
  params: Promise<{
    category: string;
  }>;
};

export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return contentCategories.map((category) => ({
    category: getCategoryPath(category).split("/").pop() ?? ""
  }));
}

export async function generateMetadata({ params }: CategoryPageProps) {
  const { category } = await params;
  const categoryLabel = getCategoryLabelFromSlug(category);

  if (!categoryLabel) {
    return {
      title: "カテゴリが見つかりません | ともちゃんねる"
    };
  }

  return {
    title: `${categoryLabel}の記事一覧 | ともちゃんねる`,
    description: `${categoryLabel}カテゴリの記事一覧です。`
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { category } = await params;
  const categoryLabel = getCategoryLabelFromSlug(category);

  if (!categoryLabel) {
    notFound();
  }

  const categoryArticles = await getArticlesByCategoryForDisplay(categoryLabel);

  return (
    <main className="mx-auto grid max-w-7xl gap-5 px-4 py-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="space-y-5">
        <section className="rounded-lg border border-zinc-200 bg-white p-4 shadow-soft sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-black text-tomo-pink">カテゴリページ</p>
              <h1 className="mt-1 text-2xl font-black text-zinc-950">{categoryLabel}</h1>
              <p className="mt-2 text-sm font-medium leading-7 text-zinc-600">
                {categoryLabel}に関する記事をまとめて読めます。関連する話題をざっと追う入口として使ってください。
              </p>
            </div>
            <div className="flex gap-2">
              <Link
                className="inline-flex h-10 items-center gap-2 rounded-md border border-zinc-200 px-4 text-sm font-black text-zinc-700 hover:bg-zinc-50"
                href="/search"
                prefetch={false}
              >
                <Search className="h-4 w-4" />
                検索
              </Link>
              <Link
                className="inline-flex h-10 items-center gap-2 rounded-md bg-zinc-950 px-4 text-sm font-black text-white hover:bg-zinc-800"
                href="/"
                prefetch={false}
              >
                <ArrowLeft className="h-4 w-4" />
                トップへ
              </Link>
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-zinc-200 bg-white p-4 shadow-soft sm:p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-black text-tomo-pink">記事一覧</p>
              <h2 className="text-xl font-black text-zinc-950">{categoryArticles.length}件の記事</h2>
            </div>
          </div>

          <div className="space-y-4">
            {categoryArticles.map((article) => (
              <ArticleCard article={article} key={article.id} />
            ))}
          </div>
        </section>
      </div>

      <RankingSidebar />
    </main>
  );
}
