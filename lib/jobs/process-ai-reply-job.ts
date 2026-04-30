import { Prisma, PrismaClient } from "@prisma/client";

import { generateReplyPlan, resolveAiReplyProviderConfigFromPayload } from "@/lib/ai/reply-provider";
import { prisma } from "@/lib/prisma";
import {
  claimNextQueuedAiReplyJob,
  markAiReplyJobCompleted,
  markAiReplyJobFailed
} from "@/lib/repositories/ai-reply-job-repository";
import {
  getNextDisplayNoForArticle,
  insertAiRepliesWithClient
} from "@/lib/repositories/comment-repository";
import { materializeReplyDrafts } from "@/lib/reply-generator";
import type { ReplyMode } from "@/lib/types";

type ProcessAiReplyJobOptions = {
  client?: PrismaClient;
};

type ProcessAiReplyJobResult =
  | {
      processed: false;
      reason: "no-queued-job";
    }
  | {
      processed: true;
      jobId: string;
      articleId: string;
      sourceCommentId: string;
      createdCommentCount: number;
      completedAt: string;
    };

function normalizeBodyLines(bodyLines: unknown) {
  if (Array.isArray(bodyLines)) {
    return bodyLines
      .map((line) => (typeof line === "string" ? line : String(line)))
      .filter((line) => line.length > 0);
  }

  return [String(bodyLines ?? "")].filter((line) => line.length > 0);
}

function normalizeReplyProviderPayload(payload: unknown) {
  return payload && typeof payload === "object" ? (payload as Record<string, unknown>) : undefined;
}

function readReplyPlanFromPayload(payload: Record<string, unknown> | undefined) {
  const replyPlan = payload?.replyPlan;

  if (!replyPlan || typeof replyPlan !== "object") {
    return undefined;
  }

  const replyPlanRecord = replyPlan as Record<string, unknown>;
  const replyMode =
    typeof replyPlanRecord.replyMode === "string"
      ? (replyPlanRecord.replyMode as ReplyMode)
      : undefined;
  const targetReplyCount =
    typeof replyPlanRecord.targetReplyCount === "number"
      ? replyPlanRecord.targetReplyCount
      : undefined;
  const personaGroup =
    typeof replyPlanRecord.personaGroup === "string" ? replyPlanRecord.personaGroup : "";

  if (!replyMode || !targetReplyCount) {
    return undefined;
  }

  return {
    replyMode,
    targetReplyCount,
    personaGroup
  };
}

export async function processNextAiReplyJob(
  options: ProcessAiReplyJobOptions = {}
): Promise<ProcessAiReplyJobResult> {
  const client = options.client ?? prisma;
  const claimedJob = await claimNextQueuedAiReplyJob(client);

  if (!claimedJob) {
    return {
      processed: false,
      reason: "no-queued-job"
    };
  }

  const sourceText = normalizeBodyLines(claimedJob.sourceComment.bodyLines).join("\n");
  const payloadObject = normalizeReplyProviderPayload(claimedJob.payload);
  const replyProviderConfig = resolveAiReplyProviderConfigFromPayload(payloadObject);
  const replyPlanFromPayload = readReplyPlanFromPayload(payloadObject);
  const replyPlan = await generateReplyPlan({
    text: sourceText,
    replyToDisplayNo: claimedJob.sourceComment.displayNo,
    article: {
      id: claimedJob.article.id,
      slug: claimedJob.article.slug,
      title: claimedJob.article.title,
      category: claimedJob.article.category
    },
    sourceComment: {
      id: claimedJob.sourceComment.id,
      displayNo: claimedJob.sourceComment.displayNo,
      authorName: claimedJob.sourceComment.authorName,
      bodyLines: normalizeBodyLines(claimedJob.sourceComment.bodyLines)
    },
    provider: replyProviderConfig.provider,
    model: replyProviderConfig.model,
    replyPlan:
      replyPlanFromPayload ??
      (claimedJob.replyMode
        ? {
            replyMode: claimedJob.replyMode,
            targetReplyCount: claimedJob.targetReplyCount,
            personaGroup: ""
          }
        : undefined)
  });

  try {
    const result = await client.$transaction(
      async (tx) => {
        const startDisplayNo = await getNextDisplayNoForArticle(tx, claimedJob.articleId);
        const materializedReplies = materializeReplyDrafts({
          articleId: claimedJob.articleId,
          parentCommentId: claimedJob.sourceCommentId,
          replyToDisplayNo: claimedJob.sourceComment.displayNo,
          startDisplayNo,
          replyDrafts: replyPlan.replyDrafts
        });

        const createdReplies = await insertAiRepliesWithClient(
          {
            articleId: claimedJob.articleId,
            parentCommentId: claimedJob.sourceCommentId,
            replyToDisplayNo: claimedJob.sourceComment.displayNo,
            replyMode: replyPlan.replyMode,
            comments: materializedReplies.map((reply) => ({
              displayNo: reply.displayNo,
              replyMode: reply.replyMode,
              authorName: reply.authorName,
              authorRole: reply.authorRole,
              shortId: reply.shortId,
              bodyLines: reply.bodyLines
            }))
          },
          tx
        );

        const completedJob = await markAiReplyJobCompleted(tx, claimedJob.id);

        return {
          createdReplies,
          completedJob
        };
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable
      }
    );

    return {
      processed: true,
      jobId: claimedJob.id,
      articleId: claimedJob.articleId,
      sourceCommentId: claimedJob.sourceCommentId,
      createdCommentCount: result.createdReplies.length,
      completedAt: result.completedJob.completedAt?.toISOString() ?? new Date().toISOString()
    };
  } catch (error) {
    const lastError = error instanceof Error ? error.message : "Failed to process AiReplyJob.";

    try {
      await markAiReplyJobFailed(client, claimedJob.id, lastError);
    } catch (markError) {
      const markErrorMessage = markError instanceof Error ? markError.message : String(markError);
      console.error(`Failed to mark AiReplyJob as failed: ${markErrorMessage}`);
    }

    throw new Error(lastError);
  }
}
