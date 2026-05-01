import { notFound } from "next/navigation";
import { ArticleDetail } from "@/components/article-detail";
import { CommentThread } from "@/components/comment-thread";
import { RankingSidebar } from "@/components/ranking-sidebar";
import { getArticleForDisplay, getStaticArticleParams } from "@/lib/article-data";

type ArticlePageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export function generateStaticParams() {
  return getStaticArticleParams();
}

export async function generateMetadata({ params }: ArticlePageProps) {
  const { slug } = await params;
  const article = await getArticleForDisplay(slug);

  if (!article) {
    return {
      title: "記事が見つかりません | ともちゃんねる"
    };
  }

  return {
    title: `${article.title} | ともちゃんねる`,
    description: article.summaryLines.join(" ")
  };
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const article = await getArticleForDisplay(slug);

  if (!article) {
    notFound();
  }

  return (
    <main className="mx-auto grid max-w-7xl gap-5 px-4 py-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="space-y-5">
        <ArticleDetail article={article} />
        <CommentThread articleId={article.id} initialComments={article.comments} />
      </div>
      <RankingSidebar />
    </main>
  );
}
