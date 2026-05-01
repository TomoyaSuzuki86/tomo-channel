import { Prisma } from "@prisma/client";
import { randomBytes } from "node:crypto";

import { resolveAiReplyProviderConfig } from "@/lib/ai/reply-provider";
import type { ReplyMode } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-static";

type CommentRequestBody = {
  articleId?: unknown;
  body?: unknown;
  parentCommentId?: unknown;
  replyToDisplayNo?: unknown;
};

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function toPositiveInteger(value: unknown) {
  if (typeof value !== "number" || !Number.isInteger(value) || value <= 0) {
    return null;
  }

  return value;
}

function splitBodyLines(body: string) {
  return body
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

function inferReplyPlan(body: string): {
  replyMode: ReplyMode;
  targetReplyCount: number;
  personaGroup: string;
} {
  const hasQuestion = /[?？]/.test(body);
  const hasConcern = /(危ない|本当|大丈夫)/.test(body);
  const hasEngineerSignals = /(n8n|API|DB|実装)/i.test(body);
  const questionMarks = (body.match(/[?？]/g) ?? []).length;

  if (hasQuestion) {
    return {
      replyMode: questionMarks > 1 ? "multi" : "explain",
      targetReplyCount: questionMarks > 1 ? 3 : 2,
      personaGroup: "名無しの詳しい人"
    };
  }

  if (hasConcern) {
    return {
      replyMode: "fact_check",
      targetReplyCount: 2,
      personaGroup: "名無しの懐疑民"
    };
  }

  if (hasEngineerSignals) {
    return {
      replyMode: body.length > 140 ? "multi" : "explain",
      targetReplyCount: body.length > 140 ? 3 : 2,
      personaGroup: "名無しのエンジニア"
    };
  }

  return {
    replyMode: "single",
    targetReplyCount: 1,
    personaGroup: "名無しのニュース民"
  };
}

function buildResponseJson(status: number, payload: Record<string, unknown>) {
  return Response.json(payload, { status });
}

function buildErrorResponse(status: number, message: string) {
  return buildResponseJson(status, {
    ok: false,
    error: message
  });
}

function makeShortId() {
  return randomBytes(4).toString("hex");
}

export async function GET(request: Request) {
  if (!process.env.DATABASE_URL) {
    return buildErrorResponse(
      500,
      "DATABASE_URL is required for /api/comments. Copy .env.example to .env and start PostgreSQL first."
    );
  }

  const { searchParams } = new URL(request.url);
  const articleId = searchParams.get("articleId")?.trim() ?? "";

  if (!articleId) {
    return buildErrorResponse(400, "articleId is required.");
  }

  const { getArticleById } = await import("@/lib/repositories/article-repository");
  const { listCommentsByArticleId } = await import("@/lib/repositories/comment-repository");

  const article = await getArticleById(articleId);

  if (!article) {
    return buildErrorResponse(404, "Article not found.");
  }

  const comments = await listCommentsByArticleId(articleId);

  return buildResponseJson(200, {
    ok: true,
    articleId,
    comments
  });
}

function buildAiReplyPayload(options: {
  article: {
    id: string;
    slug: string;
    title: string;
    category: string;
  };
  sourceComment: {
    id: string;
    displayNo: number;
    authorName: string;
    bodyLines: string[];
  };
  replyPlan: {
    replyMode: ReplyMode;
    targetReplyCount: number;
    personaGroup: string;
  };
  aiReplyProvider: {
    provider: string;
    model: string;
  };
}) {
  return {
    article: options.article,
    sourceComment: options.sourceComment,
    replyPlan: options.replyPlan,
    aiReplyProvider: options.aiReplyProvider,
    intent: "comment_reply_pipeline",
    createdBy: "api/comments"
  };
}

export async function POST(request: Request) {
  if (!process.env.DATABASE_URL) {
    return buildErrorResponse(
      500,
      "DATABASE_URL is required for /api/comments. Copy .env.example to .env and start PostgreSQL first."
    );
  }

  let body: CommentRequestBody;

  try {
    body = (await request.json()) as CommentRequestBody;
  } catch {
    return buildErrorResponse(400, "Request body must be valid JSON.");
  }

  const articleId = isString(body.articleId) ? body.articleId.trim() : "";
  const rawBody = isString(body.body) ? body.body.trim() : "";
  const parentCommentId = isString(body.parentCommentId) ? body.parentCommentId.trim() : undefined;
  const replyToDisplayNo = toPositiveInteger(body.replyToDisplayNo);

  if (!articleId) {
    return buildErrorResponse(400, "articleId is required.");
  }

  if (!rawBody) {
    return buildErrorResponse(400, "body is required.");
  }

  if (rawBody.length > 1000) {
    return buildErrorResponse(400, "body must be 1000 characters or less.");
  }

  const bodyLines = splitBodyLines(rawBody);

  if (!bodyLines.length) {
    return buildErrorResponse(400, "body must contain at least one non-empty line.");
  }

  const { prisma } = await import("@/lib/prisma");
  const { getArticleById } = await import("@/lib/repositories/article-repository");
  const {
    createAiReplyJob,
    createUserComment,
    findCommentById,
    getNextDisplayNoForArticle
  } = await import("@/lib/repositories/comment-repository");

  const article = await getArticleById(articleId);

  if (!article) {
    return buildErrorResponse(404, "Article not found.");
  }

  const replyPlan = inferReplyPlan(rawBody);
  const aiReplyProvider = resolveAiReplyProviderConfig();

  try {
    const result = await prisma.$transaction(
      async (tx) => {
        let parentDisplayNo = replyToDisplayNo ?? null;

        if (parentCommentId) {
          const parentComment = await findCommentById(tx, parentCommentId, articleId);

          if (!parentComment) {
            throw new Error("Parent comment not found for this article.");
          }

          parentDisplayNo = parentComment.displayNo;
        }

        const displayNo = await getNextDisplayNoForArticle(tx, articleId);
        const createdComment = await createUserComment(
          {
            articleId,
            displayNo,
            bodyLines,
            authorName: "名無しさん",
            authorRole: "読者",
            shortId: makeShortId(),
            parentCommentId: parentCommentId ?? null,
            replyToDisplayNo: parentDisplayNo
          },
          tx
        );

        const aiReplyJob = await createAiReplyJob(
          {
            articleId,
            sourceCommentId: createdComment.id,
            replyMode: replyPlan.replyMode,
            targetReplyCount: replyPlan.targetReplyCount,
            payload: buildAiReplyPayload({
              article: {
                id: article.id,
                slug: article.slug,
                title: article.title,
                category: article.category
              },
              sourceComment: {
                id: createdComment.id,
                displayNo: createdComment.displayNo,
                authorName: createdComment.authorName,
                bodyLines: createdComment.bodyLines
              },
              replyPlan,
              aiReplyProvider
            })
          },
          tx
        );

        return {
          createdComment,
          aiReplyJob,
          replyPlan
        };
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable
      }
    );

    return buildResponseJson(201, {
      ok: true,
      comment: result.createdComment,
      aiReplyJob: {
        id: result.aiReplyJob.id,
        articleId: result.aiReplyJob.articleId,
        sourceCommentId: result.aiReplyJob.sourceCommentId,
        status: result.aiReplyJob.status,
        replyMode: result.aiReplyJob.replyMode,
        targetReplyCount: result.aiReplyJob.targetReplyCount,
        requestedAt: result.aiReplyJob.requestedAt.toISOString()
      },
      replyPlan: result.replyPlan
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create comment.";
    const status = message.includes("Parent comment not found") ? 400 : 500;

    return buildErrorResponse(status, message);
  }
}
