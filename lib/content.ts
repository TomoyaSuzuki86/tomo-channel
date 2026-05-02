import { articles } from "@/lib/mock-data";
import { isDbBackedUiEnabled } from "@/lib/article-data";
import type { Article, Category } from "@/lib/types";

export type ContentCategory = Exclude<Category, "トップ" | "ランキング">;

type NavItem = {
  label: string;
  href: string;
};

const categoryRouteMap: Record<ContentCategory, string> = {
  速報: "sokuho",
  世界: "world",
  日本: "japan",
  テクノロジー: "technology",
  "AI・開発": "ai-dev",
  経済: "economy",
  生活: "life",
  育児: "childcare"
};

export const contentCategories: ContentCategory[] = [
  "速報",
  "世界",
  "日本",
  "テクノロジー",
  "AI・開発",
  "経済",
  "生活",
  "育児"
];

export const categoryNavItems: NavItem[] = [
  { label: "トップ", href: "/" },
  ...contentCategories.map((label) => ({ label, href: getCategoryPath(label) })),
  { label: "ランキング", href: "/#ranking" },
  { label: "アーカイブ", href: "/archive" }
];

export function getCategoryPath(category: ContentCategory) {
  return `/categories/${categoryRouteMap[category]}`;
}

export function getCategoryLabelFromSlug(slug: string): ContentCategory | null {
  const entry = Object.entries(categoryRouteMap).find(([, value]) => value === slug);
  return (entry?.[0] as ContentCategory | undefined) ?? null;
}

export function getArticlesByCategory(category: ContentCategory): Article[] {
  return articles
    .filter((article) => article.category === category)
    .sort((first, second) => new Date(second.publishedAt).getTime() - new Date(first.publishedAt).getTime());
}

export function searchArticles(query: string): Article[] {
  const normalized = query.trim().toLowerCase();

  return articles
    .filter((article) => {
      if (!normalized) {
        return true;
      }

      const haystack = [
        article.title,
        article.category,
        article.whyItMatters,
        article.tomoPoint,
        article.summaryLines.join(" "),
        article.body.join(" "),
        article.tags.join(" ")
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalized);
    })
    .sort((first, second) => new Date(second.publishedAt).getTime() - new Date(first.publishedAt).getTime());
}

export function groupArticlesByDay() {
  const sorted = [...articles].sort(
    (first, second) => new Date(second.publishedAt).getTime() - new Date(first.publishedAt).getTime()
  );
  const groups = new Map<string, Article[]>();

  for (const article of sorted) {
    const dateKey = article.publishedAt.slice(0, 10);
    const bucket = groups.get(dateKey) ?? [];
    bucket.push(article);
    groups.set(dateKey, bucket);
  }

  return [...groups.entries()].map(([dateKey, groupArticles]) => ({
    dateKey,
    label: new Intl.DateTimeFormat("ja-JP", {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "short"
    }).format(new Date(`${dateKey}T00:00:00+09:00`)),
    articles: groupArticles
  }));
}

function sortArticlesByFreshness(articleList: Article[]) {
  return [...articleList].sort(
    (first, second) =>
      new Date(second.publishedAt).getTime() - new Date(first.publishedAt).getTime() ||
      second.viewCount - first.viewCount
  );
}

function mergeArticles(primary: Article[], fallback: Article[]) {
  const seen = new Set<string>();
  const merged: Article[] = [];

  for (const article of [...primary, ...fallback]) {
    const key = article.slug || article.id;

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    merged.push(article);
  }

  return sortArticlesByFreshness(merged);
}

export async function getArticlesForDisplay(take = 20): Promise<Article[]> {
  if (!isDbBackedUiEnabled()) {
    return sortArticlesByFreshness(articles).slice(0, take);
  }

  try {
    const { listArticles } = await import("@/lib/repositories/article-repository");
    const dbArticles = await listArticles({ take });

    return mergeArticles(dbArticles, articles).slice(0, take);
  } catch (error) {
    console.error(
      JSON.stringify({
        scope: "content.articles",
        message: error instanceof Error ? error.message : "Failed to load database articles."
      })
    );

    return sortArticlesByFreshness(articles).slice(0, take);
  }
}

export async function getArticlesByCategoryForDisplay(category: ContentCategory): Promise<Article[]> {
  const displayArticles = await getArticlesForDisplay(50);

  return displayArticles.filter((article) => article.category === category);
}

export function searchArticleList(articleList: Article[], query: string): Article[] {
  const normalized = query.trim().toLowerCase();

  return sortArticlesByFreshness(
    articleList.filter((article) => {
      if (!normalized) {
        return true;
      }

      const haystack = [
        article.title,
        article.category,
        article.whyItMatters,
        article.tomoPoint,
        article.summaryLines.join(" "),
        article.body.join(" "),
        article.tags.join(" ")
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalized);
    })
  );
}

export async function groupArticlesByDayForDisplay() {
  const displayArticles = await getArticlesForDisplay(50);
  const groups = new Map<string, Article[]>();

  for (const article of displayArticles) {
    const dateKey = article.publishedAt.slice(0, 10);
    const bucket = groups.get(dateKey) ?? [];
    bucket.push(article);
    groups.set(dateKey, bucket);
  }

  return [...groups.entries()].map(([dateKey, groupArticles]) => ({
    dateKey,
    label: new Intl.DateTimeFormat("ja-JP", {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "short"
    }).format(new Date(`${dateKey}T00:00:00+09:00`)),
    articles: groupArticles
  }));
}
