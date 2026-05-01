import { articles, getArticleBySlug as getMockArticleBySlug } from "@/lib/mock-data";
import type { Article } from "@/lib/types";

export function isDbBackedUiEnabled() {
  return (
    (process.env.APP_HOSTING === "true" || process.env.FIREBASE_APP_HOSTING === "true") &&
    Boolean(process.env.DATABASE_URL)
  );
}

export function getStaticArticleParams() {
  if (process.env.APP_HOSTING === "true" || process.env.FIREBASE_APP_HOSTING === "true") {
    return [];
  }

  return articles.map((article) => ({
    slug: article.slug
  }));
}

export async function getArticleForDisplay(slug: string): Promise<Article | null> {
  if (!isDbBackedUiEnabled()) {
    return getMockArticleBySlug(slug) ?? null;
  }

  const { getArticleBySlug } = await import("@/lib/repositories/article-repository");
  const dbArticle = await getArticleBySlug(slug);

  return dbArticle ?? getMockArticleBySlug(slug) ?? null;
}
