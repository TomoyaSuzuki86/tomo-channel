import type { Comment, ReplyMode } from "@/lib/types";

export type ReplyPersona = {
  authorName: string;
  authorRole: string;
  shortId: string;
};

export type ReplyDraft = {
  commentType: "ai";
  aiGenerated: true;
  replyMode: ReplyMode;
  authorName: string;
  authorRole: string;
  shortId: string;
  bodyLines: string[];
};

export type ReplyPlan = {
  thinkingLabel: string;
  replyMode: ReplyMode;
  replyCount: number;
  personaPool: ReplyPersona[];
  replyDrafts: ReplyDraft[];
};

const personas = {
  news: {
    authorName: "名無しのニュース民",
    authorRole: "読者",
    shortId: "news_line"
  },
  engineer: {
    authorName: "名無しのエンジニア",
    authorRole: "読者",
    shortId: "engineer_99"
  },
  practical: {
    authorName: "名無しの実務民",
    authorRole: "読者",
    shortId: "field_82"
  },
  skeptic: {
    authorName: "名無しの懐疑民",
    authorRole: "読者",
    shortId: "skeptic777"
  },
  expert: {
    authorName: "名無しの詳しい人",
    authorRole: "読者",
    shortId: "detail_12"
  },
  n8n: {
    authorName: "名無しのn8n民",
    authorRole: "読者",
    shortId: "n8n_bot"
  },
  family: {
    authorName: "名無しの家計民",
    authorRole: "読者",
    shortId: "budget_31"
  }
} satisfies Record<string, ReplyPersona>;

function normalizeText(text: string) {
  return text.toLowerCase();
}

function hasAny(text: string, keywords: string[]) {
  return keywords.some((keyword) => text.includes(keyword));
}

function pickPersonaPool(mode: ReplyMode) {
  switch (mode) {
    case "explain":
      return [personas.expert, personas.news, personas.practical];
    case "fact_check":
      return [personas.skeptic, personas.expert, personas.news];
    case "debate":
      return [personas.engineer, personas.n8n, personas.practical];
    case "joke":
      return [personas.news, personas.family];
    case "multi":
      return [personas.news, personas.practical, personas.family];
    case "single":
    default:
      return [personas.news, personas.practical];
  }
}

function buildBodyLines(mode: ReplyMode, replyToDisplayNo: number, persona: ReplyPersona, text: string) {
  const reference = `>>${replyToDisplayNo}`;
  const normalized = normalizeText(text);

  if (mode === "fact_check") {
    return [
      reference,
      `${persona.authorName}だけど、そこは「本当かどうか」を一回分けて見たほうがよさそう。`,
      hasAny(normalized, ["危ない"]) ? "危険度の話と便利さの話は分けて考えるのが無難。" : "ソースと前提を先に確認すると見え方が変わる。"
    ];
  }

  if (mode === "explain") {
    return [
      reference,
      "まずは小さい範囲で試して、確認フローを先に決めるのが分かりやすい。",
      "AIは下書き係にして、人が最後に見る形がいちばん揉めにくい。"
    ];
  }

  if (mode === "debate") {
    return [
      reference,
      "実装側としては、最初から全部つなぐよりもローカルstateで流れを固定したほうが見通しがいい。",
      "APIやDBは後で差し替えやすい形にしておくのが大事。"
    ];
  }

  if (mode === "joke") {
    return [
      reference,
      "朝の流れにこのくらい軽い反応があると、まとめサイトっぽさが出るね。",
      "重くしすぎず、軽くうなずける感じがちょうどいい。"
    ];
  }

  if (mode === "multi") {
    return [
      reference,
      "複数人が順番に返してくる感じは、このサイトの雰囲気と相性がいい。",
      "短文でも視点が変わると、スレっぽい流れが出る。"
    ];
  }

  return [
    reference,
    hasAny(normalized, ["n8n", "api", "db", "実装"])
      ? "まずは流れを切り分けて、小さくつなぐのがいちばん安全。"
      : "軽く反応がつくだけでも、掲示板っぽい賑わいが出るね。"
  ];
}

export function buildMockReplyPlan({
  text,
  replyToDisplayNo
}: {
  text: string;
  replyToDisplayNo: number;
}): ReplyPlan {
  const normalized = normalizeText(text);

  let replyMode: ReplyMode = "single";
  let replyCount = 1;

  if (/[?？]/.test(text)) {
    replyMode = "explain";
    replyCount = 2;
  } else if (hasAny(normalized, ["危ない", "本当", "大丈夫"])) {
    replyMode = "fact_check";
    replyCount = 2;
  } else if (hasAny(normalized, ["n8n", "api", "db", "実装"])) {
    replyMode = "debate";
    replyCount = 3;
  } else {
    replyMode = "single";
    replyCount = 1;
  }

  const personaPool = pickPersonaPool(replyMode);
  const drafts = Array.from({ length: replyCount }, (_, index) => {
    const persona = personaPool[index % personaPool.length];
    const modeForDraft: ReplyMode =
      replyMode === "explain" && index > 0
        ? "multi"
        : replyMode === "debate" && index === 1
          ? "multi"
          : replyMode === "single" && index > 0
            ? "multi"
            : replyMode;

    return {
      commentType: "ai" as const,
      aiGenerated: true as const,
      replyMode: modeForDraft,
      authorName: persona.authorName,
      authorRole: persona.authorRole,
      shortId: persona.shortId,
      bodyLines: buildBodyLines(modeForDraft, replyToDisplayNo, persona, text)
    };
  });

  return {
    thinkingLabel: "スレ民が反応中...",
    replyMode,
    replyCount,
    personaPool,
    replyDrafts: drafts
  };
}

export function materializeReplyDrafts({
  articleId,
  parentCommentId,
  replyToDisplayNo,
  startDisplayNo,
  replyDrafts
}: {
  articleId: string;
  parentCommentId: string;
  replyToDisplayNo: number;
  startDisplayNo: number;
  replyDrafts: ReplyDraft[];
}): Comment[] {
  return replyDrafts.map((draft, index) => ({
    id: `ai-${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${index}`,
    articleId,
    displayNo: startDisplayNo + index,
    parentCommentId,
    replyToDisplayNo,
    replyMode: draft.replyMode,
    authorName: draft.authorName,
    authorRole: draft.authorRole,
    shortId: draft.shortId,
    bodyLines: draft.bodyLines,
    commentType: draft.commentType,
    aiGenerated: draft.aiGenerated,
    createdAt: new Date().toISOString(),
    likeCount: 0,
    reportCount: 0
  }));
}
