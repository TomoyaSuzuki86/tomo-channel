import { buildMockReplyPlan, type ReplyPlan } from "@/lib/reply-generator";
import type { ReplyMode } from "@/lib/types";

export type AiReplyProviderName = "mock" | "openai";

export type AiReplyProviderConfig = {
  provider: AiReplyProviderName;
  model: string;
};

export type ReplyGenerationContext = {
  text: string;
  replyToDisplayNo: number;
  article?: {
    id: string;
    slug: string;
    title: string;
    category: string;
  };
  sourceComment?: {
    id: string;
    displayNo: number;
    authorName: string;
    bodyLines: string[];
  };
  replyPlan?: {
    replyMode: ReplyMode;
    targetReplyCount: number;
    personaGroup: string;
  };
  provider?: AiReplyProviderName;
  model?: string;
};

type AllowedPersona = {
  authorName: string;
  shortId: string;
};

type OpenAiReplyDraft = {
  authorName?: string;
  authorRole?: string;
  shortId?: string;
  bodyLines: string[];
};

type OpenAiReplyPayload = {
  replyMode: ReplyMode;
  comments: OpenAiReplyDraft[];
};

const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";
const DEFAULT_OPENAI_MODEL = "gpt-5.4-mini";
const READER_ROLE = "\u8aad\u8005";
const THINKING_LABEL = "\u30b9\u30ec\u6c11\u304c\u53cd\u5fdc\u4e2d...";

const ALLOWED_PERSONAS: AllowedPersona[] = [
  { authorName: "\u540d\u7121\u3057\u306e\u30cb\u30e5\u30fc\u30b9\u6c11", shortId: "news_line" },
  { authorName: "\u540d\u7121\u3057\u306e\u30a8\u30f3\u30b8\u30cb\u30a2", shortId: "engineer_42" },
  { authorName: "\u540d\u7121\u3057\u306e\u5b9f\u52d9\u6c11", shortId: "field_82" },
  { authorName: "\u540d\u7121\u3057\u306e\u61d0\u7591\u6c11", shortId: "skeptic777" },
  { authorName: "\u540d\u7121\u3057\u306e\u8a73\u3057\u3044\u4eba", shortId: "detail_12" },
  { authorName: "\u540d\u7121\u3057\u306en8n\u6c11", shortId: "n8n_bot" },
  { authorName: "\u540d\u7121\u3057\u306e\u5bb6\u8a08\u6c11", shortId: "budget_31" }
];

const replyModeValues: ReplyMode[] = [
  "single",
  "multi",
  "debate",
  "explain",
  "fact_check",
  "joke"
];

function isReplyMode(value: unknown): value is ReplyMode {
  return typeof value === "string" && replyModeValues.includes(value as ReplyMode);
}

function normalizeLines(lines: string[]) {
  return lines.map((line) => line.trim()).filter((line) => line.length > 0);
}

function findAllowedPersona(authorName: string | undefined, index: number): AllowedPersona {
  if (authorName) {
    const exactMatch = ALLOWED_PERSONAS.find((persona) => persona.authorName === authorName);

    if (exactMatch) {
      return exactMatch;
    }
  }

  return ALLOWED_PERSONAS[index % ALLOWED_PERSONAS.length];
}

export function ensureReplyReferenceLine(replyToDisplayNo: number, bodyLines: string[]) {
  const reference = `>>${replyToDisplayNo}`;
  const normalized = normalizeLines(bodyLines);
  const withoutDuplicateReference = normalized.filter((line) => line !== reference);

  if (withoutDuplicateReference[0]?.startsWith(">>")) {
    withoutDuplicateReference[0] = reference;
    return withoutDuplicateReference;
  }

  return [reference, ...withoutDuplicateReference];
}

export function resolveAiReplyProviderName(
  rawValue = process.env.AI_REPLY_PROVIDER
): AiReplyProviderName {
  return rawValue?.trim().toLowerCase() === "openai" ? "openai" : "mock";
}

export function resolveAiReplyModel(rawValue = process.env.OPENAI_MODEL) {
  return rawValue?.trim() || DEFAULT_OPENAI_MODEL;
}

export function resolveAiReplyProviderConfig(): AiReplyProviderConfig {
  return {
    provider: resolveAiReplyProviderName(),
    model: resolveAiReplyModel()
  };
}

export function resolveAiReplyProviderConfigFromPayload(
  payload: Record<string, unknown> | null | undefined
): AiReplyProviderConfig {
  const providerSource =
    payload && typeof payload.aiReplyProvider === "object" && payload.aiReplyProvider
      ? (payload.aiReplyProvider as Record<string, unknown>)
      : payload;
  const rawProvider =
    providerSource && typeof providerSource.provider === "string" ? providerSource.provider : "";
  const rawModel =
    providerSource && typeof providerSource.model === "string" ? providerSource.model : "";

  return {
    provider: rawProvider.trim() ? resolveAiReplyProviderName(rawProvider) : resolveAiReplyProviderName(),
    model: rawModel.trim() || resolveAiReplyModel()
  };
}

function buildOpenAiSystemPrompt() {
  return [
    "You generate short Japanese forum-style replies for a news board UI.",
    "Write in a natural, cautious, non-defamatory tone.",
    "Do not impersonate a real person.",
    "Do not cite real forum posts.",
    "Focus on body text only; persona labels will be normalized by the app.",
    "Return only JSON that matches the schema."
  ].join("\n");
}

function buildOpenAiUserPrompt(context: ReplyGenerationContext) {
  return JSON.stringify(
    {
      article: context.article,
      sourceComment: {
        displayNo: context.replyToDisplayNo,
        authorName: context.sourceComment?.authorName,
        bodyLines: context.sourceComment?.bodyLines ?? []
      },
      replyModeHint: context.replyPlan?.replyMode,
      targetReplyCount: context.replyPlan?.targetReplyCount ?? 1,
      personas: ALLOWED_PERSONAS.map((persona) => persona.authorName)
    },
    null,
    2
  );
}

function buildOpenAiSchema() {
  return {
    type: "object",
    additionalProperties: false,
    required: ["replyMode", "comments"],
    properties: {
      replyMode: {
        type: "string",
        enum: replyModeValues
      },
      comments: {
        type: "array",
        minItems: 1,
        maxItems: 3,
        items: {
          type: "object",
          additionalProperties: false,
          required: ["authorName", "authorRole", "shortId", "bodyLines"],
          properties: {
            authorName: {
              type: "string",
              minLength: 1
            },
            authorRole: {
              type: "string",
              minLength: 1
            },
            shortId: {
              type: "string",
              minLength: 1
            },
            bodyLines: {
              type: "array",
              minItems: 1,
              maxItems: 6,
              items: {
                type: "string",
                minLength: 1
              }
            }
          }
        }
      }
    }
  };
}

function extractOpenAiText(responseJson: Record<string, unknown>) {
  if (typeof responseJson.output_text === "string" && responseJson.output_text.trim()) {
    return responseJson.output_text.trim();
  }

  const output = Array.isArray(responseJson.output) ? responseJson.output : [];

  for (const item of output) {
    if (!item || typeof item !== "object") {
      continue;
    }

    const content = Array.isArray((item as { content?: unknown }).content)
      ? ((item as { content: unknown[] }).content ?? [])
      : [];

    for (const contentItem of content) {
      if (!contentItem || typeof contentItem !== "object") {
        continue;
      }

      const type = (contentItem as { type?: unknown }).type;
      const text = (contentItem as { text?: unknown }).text;

      if (
        (type === "output_text" || type === "text") &&
        typeof text === "string" &&
        text.trim()
      ) {
        return text.trim();
      }
    }
  }

  throw new Error("OpenAI response did not include structured text output.");
}

function parseOpenAiReplyPayload(payloadText: string): OpenAiReplyPayload {
  const parsed = JSON.parse(payloadText) as Partial<OpenAiReplyPayload>;

  if (!isReplyMode(parsed.replyMode)) {
    throw new Error("OpenAI reply payload did not include a valid replyMode.");
  }

  if (!Array.isArray(parsed.comments) || parsed.comments.length === 0) {
    throw new Error("OpenAI reply payload did not include any comments.");
  }

  const comments = parsed.comments.slice(0, 3).map((comment) => {
    const bodyLines = Array.isArray(comment.bodyLines)
      ? comment.bodyLines.map((line) => (typeof line === "string" ? line : String(line)))
      : [];

    return {
      authorName: typeof comment.authorName === "string" ? comment.authorName.trim() : undefined,
      authorRole: typeof comment.authorRole === "string" ? comment.authorRole.trim() : undefined,
      shortId: typeof comment.shortId === "string" ? comment.shortId.trim() : undefined,
      bodyLines
    };
  });

  return {
    replyMode: parsed.replyMode,
    comments
  };
}

function toReplyPlan(payload: OpenAiReplyPayload, context: ReplyGenerationContext): ReplyPlan {
  const replyDrafts = payload.comments.map((comment, index) => {
    const persona = findAllowedPersona(comment.authorName, index);

    return {
      commentType: "ai" as const,
      aiGenerated: true as const,
      replyMode: payload.replyMode,
      authorName: persona.authorName,
      authorRole: READER_ROLE,
      shortId: persona.shortId,
      bodyLines: ensureReplyReferenceLine(context.replyToDisplayNo, comment.bodyLines)
    };
  });

  return {
    thinkingLabel: THINKING_LABEL,
    replyMode: payload.replyMode,
    replyCount: replyDrafts.length,
    personaPool: replyDrafts.map((draft) => ({
      authorName: draft.authorName,
      authorRole: draft.authorRole,
      shortId: draft.shortId
    })),
    replyDrafts
  };
}

async function generateOpenAiReplyPlan(context: ReplyGenerationContext) {
  const apiKey = process.env.OPENAI_API_KEY?.trim();

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is required when AI_REPLY_PROVIDER=openai.");
  }

  const model = context.model?.trim() || resolveAiReplyModel();
  const response = await fetch(OPENAI_RESPONSES_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      input: [
        {
          role: "system",
          content: [
            {
              type: "input_text",
              text: buildOpenAiSystemPrompt()
            }
          ]
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: buildOpenAiUserPrompt(context)
            }
          ]
        }
      ],
      text: {
        format: {
          type: "json_schema",
          name: "tomo_channel_ai_reply",
          schema: buildOpenAiSchema(),
          strict: true
        }
      }
    })
  });

  const responseJson = (await response.json().catch(() => ({}))) as Record<string, unknown>;

  if (!response.ok) {
    const message =
      (typeof responseJson.error === "object" &&
        responseJson.error !== null &&
        typeof (responseJson.error as { message?: unknown }).message === "string" &&
        (responseJson.error as { message: string }).message) ||
      `OpenAI request failed with status ${response.status}.`;

    throw new Error(message);
  }

  const payloadText = extractOpenAiText(responseJson);
  const parsed = parseOpenAiReplyPayload(payloadText);

  return toReplyPlan(parsed, context);
}

export async function generateReplyPlan(context: ReplyGenerationContext) {
  const resolvedProvider = context.provider ?? resolveAiReplyProviderName();

  if (resolvedProvider === "openai") {
    return generateOpenAiReplyPlan(context);
  }

  return buildMockReplyPlan({
    text: context.text,
    replyToDisplayNo: context.replyToDisplayNo
  });
}
