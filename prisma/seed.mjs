const localDatabaseUrl =
  "postgresql://tomo_channel:tomo_channel@localhost:5432/tomo_channel?schema=public";

if (!process.env.DATABASE_URL && process.env.NODE_ENV !== "production") {
  process.env.DATABASE_URL = localDatabaseUrl;
}

const { PrismaClient } = await import("@prisma/client");

const prisma = new PrismaClient();

function toDate(value) {
  return new Date(value);
}

function toJson(value) {
  return value;
}

function buildAiReplyJobPayload(article, sourceComment) {
  return {
    article: {
      id: article.id,
      slug: article.slug,
      title: article.title,
      category: article.category
    },
    sourceComment: {
      id: sourceComment.id,
      displayNo: sourceComment.displayNo,
      authorName: sourceComment.authorName,
      bodyLines: sourceComment.bodyLines
    },
    intent: "mock_ai_reply"
  };
}

async function seedArticle(article) {
  return prisma.article.create({
    data: {
      id: article.id,
      slug: article.slug,
      title: article.title,
      category: article.category,
      publishedAt: toDate(article.publishedAt),
      summaryLines: toJson(article.summaryLines),
      body: toJson(article.body),
      whyItMatters: article.whyItMatters,
      tomoPoint: article.tomoPoint,
      thumbnailUrl: article.thumbnailUrl,
      tags: toJson(article.tags),
      viewCount: article.viewCount,
      sources: {
        create: article.sources.map((source, index) => ({
          label: source.label,
          url: source.url,
          sortOrder: index
        }))
      },
      comments: {
        create: article.comments.map((comment) => ({
          id: comment.id,
          displayNo: comment.displayNo,
          parentCommentId: comment.parentCommentId ?? null,
          replyToDisplayNo: comment.replyToDisplayNo ?? null,
          replyMode: comment.replyMode ?? null,
          authorName: comment.authorName,
          authorRole: comment.authorRole,
          shortId: comment.shortId,
          bodyLines: toJson(comment.bodyLines),
          commentType: comment.commentType,
          aiGenerated: comment.aiGenerated,
          createdAt: toDate(comment.createdAt),
          likeCount: comment.likeCount,
          reportCount: comment.reportCount
        }))
      }
    }
  });
}

async function seedAiReplyJobs(seedArticles) {
  const jobs = [];

  for (const article of seedArticles) {
    const sourceComment = article.comments.find((comment) => comment.commentType === "user");

    if (!sourceComment) {
      continue;
    }

    jobs.push({
      articleId: article.id,
      sourceCommentId: sourceComment.id,
      status: "queued",
      replyMode: sourceComment.replyMode ?? "single",
      targetReplyCount: 2,
      payload: buildAiReplyJobPayload(article, sourceComment)
    });
  }

  if (!jobs.length) {
    return;
  }

  await prisma.aiReplyJob.createMany({
    data: jobs
  });
}

async function main() {
  const { articles: seedArticles } = await import("../lib/mock-data.ts");

  await prisma.$transaction([
    prisma.aiReplyJob.deleteMany(),
    prisma.comment.deleteMany(),
    prisma.articleSource.deleteMany(),
    prisma.article.deleteMany()
  ]);

  for (const article of seedArticles) {
    await seedArticle(article);
  }

  await seedAiReplyJobs(seedArticles);

  console.log(`Seeded ${seedArticles.length} articles from lib/mock-data.ts.`);
  console.log("User comments and AI comments are stored separately in the database.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
