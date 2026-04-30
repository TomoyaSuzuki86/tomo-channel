import { processNextAiReplyJob } from "@/lib/jobs/process-ai-reply-job";
import { authorizeJobProcessRequest } from "@/lib/jobs/job-process-auth";

export const runtime = "nodejs";

function buildJson(status: number, payload: Record<string, unknown>) {
  return Response.json(payload, { status });
}

export async function POST(request: Request) {
  const auth = authorizeJobProcessRequest(request);

  if (!auth.allowed) {
    return buildJson(auth.status, {
      ok: false,
      processed: false,
      error: auth.error
    });
  }

  try {
    const result = await processNextAiReplyJob();

    if (!result.processed) {
      return buildJson(200, {
        ok: true,
        processed: false,
        reason: result.reason
      });
    }

    return buildJson(200, {
      ok: true,
      processed: true,
      jobId: result.jobId,
      articleId: result.articleId,
      sourceCommentId: result.sourceCommentId,
      createdCommentCount: result.createdCommentCount,
      completedAt: result.completedAt
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to process AiReplyJob.";

    return buildJson(500, {
      ok: false,
      processed: false,
      error: message
    });
  }
}
