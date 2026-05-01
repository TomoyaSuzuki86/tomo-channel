import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { Comment, ReplyMode } from "@/lib/types";

type CommentWithRelations = Prisma.CommentGetPayload<Record<string, never>>;
type CommentWriteClient = Prisma.TransactionClient;

function parseJsonArray<T>(value: Prisma.JsonValue): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function mapComment(comment: CommentWithRelations): Comment {
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

type CreateUserCommentInput = {
  articleId: string;
  displayNo: number;
  bodyLines: string[];
  authorName: string;
  authorRole: string;
  shortId: string;
  parentCommentId?: string | null;
  replyToDisplayNo?: number | null;
};

export async function listCommentsByArticleId(articleId: string) {
  const comments = await prisma.comment.findMany({
    where: { articleId },
    orderBy: [{ displayNo: "asc" }, { createdAt: "asc" }]
  });

  return comments.map(mapComment);
}

export async function listComments() {
  const comments = await prisma.comment.findMany({
    orderBy: [{ articleId: "asc" }, { displayNo: "asc" }, { createdAt: "asc" }]
  });

  return comments.map(mapComment);
}

export async function getNextDisplayNoForArticle(
  client: CommentWriteClient,
  articleId: string
) {
  const aggregate = await client.comment.aggregate({
    where: { articleId },
    _max: {
      displayNo: true
    }
  });

  return (aggregate._max.displayNo ?? 0) + 1;
}

export async function findCommentById(
  client: CommentWriteClient,
  commentId: string,
  articleId: string
) {
  return client.comment.findFirst({
    where: {
      id: commentId,
      articleId
    }
  });
}

export async function createUserComment(
  input: CreateUserCommentInput,
  client: CommentWriteClient = prisma
) {
  const comment = await client.comment.create({
    data: {
      articleId: input.articleId,
      displayNo: input.displayNo,
      parentCommentId: input.parentCommentId ?? null,
      replyToDisplayNo: input.replyToDisplayNo ?? null,
      replyMode: null,
      authorName: input.authorName,
      authorRole: input.authorRole,
      shortId: input.shortId,
      bodyLines: input.bodyLines as Prisma.JsonArray,
      commentType: "user",
      aiGenerated: false
    }
  });

  return mapComment(comment);
}

type CreateAiReplyJobInput = {
  articleId: string;
  sourceCommentId: string;
  replyMode: ReplyMode;
  targetReplyCount: number;
  payload: Prisma.InputJsonValue;
};

export async function createAiReplyJob(
  input: CreateAiReplyJobInput,
  client: CommentWriteClient = prisma
) {
  return client.aiReplyJob.create({
    data: {
      articleId: input.articleId,
      sourceCommentId: input.sourceCommentId,
      replyMode: input.replyMode,
      targetReplyCount: input.targetReplyCount,
      payload: input.payload
    }
  });
}

type InsertAiRepliesInput = {
  articleId: string;
  parentCommentId: string;
  replyToDisplayNo: number;
  replyMode: ReplyMode;
  comments: Array<{
    displayNo: number;
    replyMode?: ReplyMode;
    authorName: string;
    authorRole: string;
    shortId: string;
    bodyLines: string[];
  }>;
};

export async function insertAiReplies(input: InsertAiRepliesInput) {
  return prisma.$transaction((tx) => insertAiRepliesWithClient(input, tx));
}

export async function insertAiRepliesWithClient(
  input: InsertAiRepliesInput,
  client: CommentWriteClient
) {
  const createdComments: Array<Awaited<ReturnType<typeof client.comment.create>>> = [];

  for (const comment of input.comments) {
    createdComments.push(
      await client.comment.create({
        data: {
          articleId: input.articleId,
          displayNo: comment.displayNo,
          parentCommentId: input.parentCommentId,
          replyToDisplayNo: input.replyToDisplayNo,
          replyMode: comment.replyMode ?? input.replyMode,
          authorName: comment.authorName,
          authorRole: comment.authorRole,
          shortId: comment.shortId,
          bodyLines: comment.bodyLines as Prisma.JsonArray,
          commentType: "ai",
          aiGenerated: true
        }
      })
    );
  }

  return createdComments.map(mapComment);
}
