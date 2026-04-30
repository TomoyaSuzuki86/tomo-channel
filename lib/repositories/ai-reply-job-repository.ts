import { Prisma, PrismaClient } from "@prisma/client";

import { prisma } from "@/lib/prisma";

type AiReplyJobWithRelations = Prisma.AiReplyJobGetPayload<{
  include: {
    article: true;
    sourceComment: true;
  };
}>;

type AiReplyJobTransactionClient = Prisma.TransactionClient;
type AiReplyJobWritableClient = Pick<PrismaClient, "aiReplyJob">;

async function findAndClaimNextQueuedJob(client: AiReplyJobTransactionClient) {
  const lockedJobs = await client.$queryRaw<Array<{ id: string }>>(Prisma.sql`
    SELECT "id"
    FROM "AiReplyJob"
    WHERE "status" = 'queued'
    ORDER BY "requestedAt" ASC, "createdAt" ASC
    LIMIT 1
    FOR UPDATE SKIP LOCKED
  `);

  if (!lockedJobs.length) {
    return null;
  }

  return client.aiReplyJob.update({
    where: {
      id: lockedJobs[0].id
    },
    data: {
      status: "sending",
      sentAt: new Date()
    },
    include: {
      article: true,
      sourceComment: true
    }
  }) as Promise<AiReplyJobWithRelations>;
}

export async function claimNextQueuedAiReplyJob(client: PrismaClient = prisma) {
  return client.$transaction(async (tx) => findAndClaimNextQueuedJob(tx));
}

export async function markAiReplyJobCompleted(client: AiReplyJobWritableClient, jobId: string) {
  return client.aiReplyJob.update({
    where: {
      id: jobId
    },
    data: {
      status: "completed",
      completedAt: new Date()
    }
  });
}

export async function markAiReplyJobFailed(client: AiReplyJobWritableClient, jobId: string, lastError: string) {
  return client.aiReplyJob.update({
    where: {
      id: jobId
    },
    data: {
      status: "failed",
      lastError
    }
  });
}
