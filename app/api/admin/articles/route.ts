import { authorizeAdminRequest } from "@/lib/admin/admin-api-auth";
import { createAdminArticle } from "@/lib/repositories/admin-article-repository";

export const runtime = "nodejs";
export const revalidate = false;
export const fetchCache = "force-no-store";

type AdminArticleSourceInput = {
  label?: unknown;
  url?: unknown;
};

type AdminInitialEditorCommentInput =
  | {
      bodyLines?: unknown;
      authorName?: unknown;
      shortId?: unknown;
    }
  | unknown[];

type AdminArticleRequestBody = {
  slug?: unknown;
  title?: unknown;
  category?: unknown;
  publishedAt?: unknown;
  summaryLines?: unknown;
  summary?: unknown;
  bodyLines?: unknown;
  body?: unknown;
  whyItMatters?: unknown;
  tomoPoint?: unknown;
  thumbnailUrl?: unknown;
  tags?: unknown;
  sources?: unknown;
  initialEditorComment?: AdminInitialEditorCommentInput;
};

function buildResponseJson(status: number, payload: Record<string, unknown>) {
  return Response.json(payload, { status });
}

function buildErrorResponse(status: number, message: string) {
  return buildResponseJson(status, {
    ok: false,
    error: message
  });
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function normalizeText(value: unknown) {
  return isString(value) ? value.trim() : "";
}

function normalizeStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return null;
  }

  const normalized = value
    .map((item) => (isString(item) ? item.replace(/\u3000/g, " ").trim() : ""))
    .filter((item) => item.length > 0);

  return normalized.length > 0 ? normalized : null;
}

function toDate(value: unknown) {
  if (value === undefined || value === null || value === "") {
    return new Date();
  }

  if (!isString(value) && !(value instanceof Date)) {
    return null;
  }

  const parsed = new Date(value);

  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function isValidSlug(slug: string) {
  return /^[A-Za-z0-9-]+$/.test(slug);
}

function isValidUrl(value: string) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function getStringField(value: unknown) {
  return isString(value) ? value.trim() : "";
}

function normalizeSources(value: unknown) {
  if (!Array.isArray(value)) {
    return null;
  }

  const sources = value
    .map((source, index) => {
      if (!source || typeof source !== "object") {
        return null;
      }

      const candidate = source as AdminArticleSourceInput;
      const label = getStringField(candidate.label);
      const url = getStringField(candidate.url);

      if (!label || !url) {
        return null;
      }

      return {
        label,
        url,
        sortOrder: index
      };
    })
    .filter((source): source is { label: string; url: string; sortOrder: number } => Boolean(source));

  return sources.length > 0 ? sources : null;
}

function normalizeInitialEditorComment(value: unknown) {
  if (Array.isArray(value)) {
    const bodyLines = normalizeStringArray(value);

    return bodyLines
      ? {
          bodyLines,
          authorName: "editor",
          shortId: "editor"
        }
      : null;
  }

  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as {
    bodyLines?: unknown;
    authorName?: unknown;
    shortId?: unknown;
  };

  const bodyLines = normalizeStringArray(candidate.bodyLines);

  if (!bodyLines) {
    return null;
  }

  return {
    bodyLines,
    authorName: normalizeText(candidate.authorName) || "editor",
    shortId: normalizeText(candidate.shortId) || "editor"
  };
}

function logAdminArticleError(message: string, context: Record<string, unknown> = {}) {
  console.error(
    JSON.stringify({
      scope: "api.admin.articles",
      message,
      ...context
    })
  );
}

export async function POST(request: Request) {
  const authResult = authorizeAdminRequest(request);

  if (!authResult.ok) {
    return authResult.response;
  }

  let body: AdminArticleRequestBody;

  try {
    body = (await request.json()) as AdminArticleRequestBody;
  } catch {
    return buildErrorResponse(400, "Request body must be valid JSON.");
  }

  const slug = normalizeText(body.slug);
  const title = normalizeText(body.title);
  const category = normalizeText(body.category);
  const whyItMatters = normalizeText(body.whyItMatters);
  const tomoPoint = normalizeText(body.tomoPoint);
  const thumbnailUrl = normalizeText(body.thumbnailUrl);
  const summaryLines = normalizeStringArray(body.summaryLines ?? body.summary);
  const bodyLines = normalizeStringArray(body.bodyLines ?? body.body);
  const tags = normalizeStringArray(body.tags) ?? [];
  const sources = normalizeSources(body.sources);
  const publishedAt = toDate(body.publishedAt);
  const initialEditorComment = normalizeInitialEditorComment(body.initialEditorComment);

  if (!slug) {
    return buildErrorResponse(400, "slug is required.");
  }

  if (!isValidSlug(slug)) {
    return buildErrorResponse(400, "slug may contain only letters, numbers, and hyphens.");
  }

  if (!title || title.length < 4 || title.length > 120) {
    return buildErrorResponse(400, "title must be between 4 and 120 characters.");
  }

  if (!category || category.length < 1 || category.length > 40) {
    return buildErrorResponse(400, "category must be between 1 and 40 characters.");
  }

  if (!summaryLines) {
    return buildErrorResponse(400, "summaryLines is required.");
  }

  if (summaryLines.length > 5) {
    return buildErrorResponse(400, "summaryLines must be 5 lines or less.");
  }

  if (summaryLines.some((line) => line.length < 1 || line.length > 160)) {
    return buildErrorResponse(400, "Each summary line must be between 1 and 160 characters.");
  }

  if (!bodyLines) {
    return buildErrorResponse(400, "bodyLines is required.");
  }

  if (bodyLines.length > 40) {
    return buildErrorResponse(400, "bodyLines must be 40 lines or less.");
  }

  if (bodyLines.some((line) => line.length < 1 || line.length > 600)) {
    return buildErrorResponse(400, "Each body line must be between 1 and 600 characters.");
  }

  if (!whyItMatters || whyItMatters.length > 240) {
    return buildErrorResponse(400, "whyItMatters must be between 1 and 240 characters.");
  }

  if (!tomoPoint || tomoPoint.length > 240) {
    return buildErrorResponse(400, "tomoPoint must be between 1 and 240 characters.");
  }

  if (!thumbnailUrl || !isValidUrl(thumbnailUrl)) {
    return buildErrorResponse(400, "thumbnailUrl must be a valid http(s) URL.");
  }

  if (tags.length > 10) {
    return buildErrorResponse(400, "tags must be 10 items or less.");
  }

  if (tags.some((tag) => tag.length > 32)) {
    return buildErrorResponse(400, "Each tag must be 32 characters or less.");
  }

  if (!sources) {
    return buildErrorResponse(400, "At least one source is required.");
  }

  if (sources.some((source) => source.label.length > 160 || source.url.length > 2048)) {
    return buildErrorResponse(
      400,
      "Each source label must be 160 characters or less and each URL must be 2048 characters or less."
    );
  }

  if (sources.some((source) => !isValidUrl(source.url))) {
    return buildErrorResponse(400, "Each source url must be a valid http(s) URL.");
  }

  if (initialEditorComment && initialEditorComment.bodyLines.some((line) => line.length > 300)) {
    return buildErrorResponse(400, "Each initial editor comment line must be 300 characters or less.");
  }

  if (!process.env.DATABASE_URL) {
    return buildErrorResponse(500, "DATABASE_URL is required.");
  }

  try {
    const article = await createAdminArticle({
      slug,
      title,
      category,
      publishedAt: publishedAt ?? new Date(),
      summaryLines,
      bodyLines,
      whyItMatters,
      tomoPoint,
      thumbnailUrl,
      tags,
      sources,
      initialEditorComment: initialEditorComment ?? undefined
    });

    return buildResponseJson(201, {
      ok: true,
      article,
      sourceCount: article.sources.length,
      initialEditorCommentCreated: article.comments.length > 0
    });
  } catch (error) {
    const code = error instanceof Error ? (error as Error & { code?: string }).code : undefined;

    if (code === "P2002") {
      return buildErrorResponse(409, "An article with this slug already exists.");
    }

    const message = error instanceof Error ? error.message : "Failed to create article.";

    logAdminArticleError(message, {
      slug,
      category
    });

    return buildErrorResponse(500, message);
  }
}
