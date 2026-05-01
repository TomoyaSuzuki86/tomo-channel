import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import type { Article, Comment, Source } from "@/lib/types";

type ArticleWithRelations = Prisma.ArticleGetPayload<{
  include: {
    sources: true;
    comments: true;
  };
}>;

type CreateAdminArticleInput = {
  slug: string;
  title: string;
  category: string;
  publishedAt: Date;
  summaryLines: string[];
  bodyLines: string[];
  whyItMatters: string;
  tomoPoint: string;
  thumbnailUrl: string;
  tags: string[];
  sources: Array<{
    label: string;
    url: string;
    sortOrder: number;
  }>;
  initialEditorComment?: {
    bodyLines: string[];
    authorName: string;
    shortId: string;
  };
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
    sources: article.sources
      .slice()
      .sort((first, second) => first.sortOrder - second.sortOrder)
      .map(mapSource),
    comments: article.comments
      .slice()
      .sort((first, second) => first.displayNo - second.displayNo)
      .map(mapComment),
    tags: parseJsonArray<string>(article.tags),
    viewCount: article.viewCount
  };
}

export async function createAdminArticle(input: CreateAdminArticleInput) {
  const article = await prisma.$transaction(
    async (tx) => {
      const createdArticle = await tx.article.create({
        data: {
          slug: input.slug,
          title: input.title,
          category: input.category,
          publishedAt: input.publishedAt,
          summaryLines: input.summaryLines as Prisma.JsonArray,
          body: input.bodyLines as Prisma.JsonArray,
          whyItMatters: input.whyItMatters,
          tomoPoint: input.tomoPoint,
          thumbnailUrl: input.thumbnailUrl,
          tags: input.tags as Prisma.JsonArray,
          sources: {
            create: input.sources.map((source) => ({
              label: source.label,
              url: source.url,
              sortOrder: source.sortOrder
            }))
          },
          comments: input.initialEditorComment
            ? {
                create: [
                  {
                    displayNo: 1,
                    authorName: input.initialEditorComment.authorName,
                    authorRole: "editor",
                    shortId: input.initialEditorComment.shortId,
                    bodyLines: input.initialEditorComment.bodyLines as Prisma.JsonArray,
                    commentType: "editor",
                    aiGenerated: false
                  }
                ]
              }
            : undefined
        }
      });

      const storedArticle = await tx.article.findUnique({
        where: { id: createdArticle.id },
        include: {
          sources: true,
          comments: true
        }
      });

      if (!storedArticle) {
        throw new Error("Created article could not be loaded.");
      }

      return storedArticle;
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable
    }
  );

  return mapArticle(article);
}
