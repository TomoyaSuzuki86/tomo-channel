import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { Article, Category, Comment, Source } from "@/lib/types";

type ArticleWithRelations = Prisma.ArticleGetPayload<{
  include: {
    sources: true;
    comments: true;
  };
}>;

type ArticleQuery = {
  category?: Category | string;
  query?: string;
  take?: number;
};

function parseJsonArray<T>(value: Prisma.JsonValue): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function mapSource(source: ArticleWithRelations["sources"][number]): Source {
  return {
    id: source.id,
    label: source.label,
    url: source.url
  };
}

function mapComment(comment: ArticleWithRelations["comments"][number]): Comment {
  return {
    id: comment.id,
    articleId: comment.articleId,
    displayNo: comment.displayNo,
    parentCommentId: comment.parentCommentId ?? undefined,
    replyToDisplayNo: comment.replyToDisplayNo ?? undefined,
    replyMode: comment.replyMode ?? undefined,
    authorName: comment.authorName,
    authorRole: comment.authorRole,
    shortId: comment.shortId,
    bodyLines: parseJsonArray<string>(comment.bodyLines),
    commentType: comment.commentType,
    aiGenerated: comment.aiGenerated,
    createdAt: comment.createdAt.toISOString(),
    likeCount: comment.likeCount,
    reportCount: comment.reportCount
  };
}

function mapArticle(article: ArticleWithRelations): Article {
  return {
    id: article.id,
    slug: article.slug,
    title: article.title,
    category: article.category as Article["category"],
    publishedAt: article.publishedAt.toISOString(),
    summaryLines: parseJsonArray<string>(article.summaryLines),
    body: parseJsonArray<string>(article.body),
    whyItMatters: article.whyItMatters,
    tomoPoint: article.tomoPoint,
    thumbnailUrl: article.thumbnailUrl,
    tags: parseJsonArray<string>(article.tags),
    sources: article.sources
      .slice()
      .sort((first, second) => first.sortOrder - second.sortOrder)
      .map(mapSource),
    comments: article.comments
      .slice()
      .sort((first, second) => first.displayNo - second.displayNo)
      .map(mapComment),
    viewCount: article.viewCount
  };
}

export async function listArticles(options: ArticleQuery = {}) {
  const { category, query, take = 20 } = options;

  const articles = await prisma.article.findMany({
    where: {
      ...(category ? { category } : {}),
      ...(query
        ? {
            OR: [
              { title: { contains: query, mode: "insensitive" } },
              { whyItMatters: { contains: query, mode: "insensitive" } },
              { tomoPoint: { contains: query, mode: "insensitive" } }
            ]
          }
        : {})
    },
    include: {
      sources: true,
      comments: true
    },
    orderBy: [{ publishedAt: "desc" }, { viewCount: "desc" }],
    take
  });

  return articles.map(mapArticle);
}

export async function getArticleBySlug(slug: string) {
  const article = await prisma.article.findUnique({
    where: { slug },
    include: {
      sources: true,
      comments: true
    }
  });

  return article ? mapArticle(article) : null;
}

export async function listRecentArticleSummaries(take = 10) {
  return prisma.article.findMany({
    select: {
      id: true,
      slug: true,
      title: true,
      category: true,
      publishedAt: true,
      thumbnailUrl: true,
      viewCount: true,
      _count: {
        select: {
          comments: true
        }
      }
    },
    orderBy: [{ publishedAt: "desc" }, { viewCount: "desc" }],
    take
  });
}
