import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadLocalEnv() {
  const envPath = resolve(process.cwd(), ".env");

  if (!existsSync(envPath)) {
    return;
  }

  const lines = readFileSync(envPath, "utf8").split(/\r?\n/);

  for (const line of lines) {
    const trimmedLine = line.trim();

    if (!trimmedLine || trimmedLine.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmedLine.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmedLine.slice(0, separatorIndex).trim();
    const rawValue = trimmedLine.slice(separatorIndex + 1).trim();
    const value = rawValue.replace(/^["']|["']$/g, "");

    if (key && !process.env[key]) {
      process.env[key] = value;
    }
  }
}

loadLocalEnv();

const localDatabaseUrl =
  "postgresql://tomo_channel:tomo_channel@localhost:5432/tomo_channel?schema=public";

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = localDatabaseUrl;
  console.log("DATABASE_URL was not set, so the local Docker Compose PostgreSQL URL is being used.");
}

const { processNextAiReplyJob } = await import("../lib/jobs/process-ai-reply-job.ts");

async function main() {
  const result = await processNextAiReplyJob();

  if (!result.processed) {
    console.log("No queued AiReplyJob found.");
    return;
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        jobId: result.jobId,
        articleId: result.articleId,
        sourceCommentId: result.sourceCommentId,
        createdCommentCount: result.createdCommentCount,
        completedAt: result.completedAt
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
