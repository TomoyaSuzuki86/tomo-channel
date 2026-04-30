export type Category =
  | "トップ"
  | "速報"
  | "世界"
  | "日本"
  | "テクノロジー"
  | "AI・開発"
  | "経済"
  | "生活"
  | "育児"
  | "ランキング";

export type Source = {
  id: string;
  label: string;
  url: string;
};

export type CommentType = "user" | "ai" | "editor";
export type ReplyMode = "single" | "multi" | "debate" | "explain" | "fact_check" | "joke";

export type Comment = {
  id: string;
  articleId: string;
  displayNo: number;
  parentCommentId?: string;
  replyToDisplayNo?: number;
  replyMode?: ReplyMode;
  isPending?: boolean;
  authorName: string;
  authorRole: string;
  shortId: string;
  bodyLines: string[];
  commentType: CommentType;
  aiGenerated: boolean;
  createdAt: string;
  likeCount: number;
  reportCount: number;
};

export type Article = {
  id: string;
  slug: string;
  title: string;
  category: Category;
  publishedAt: string;
  summaryLines: string[];
  body: string[];
  whyItMatters: string;
  tomoPoint: string;
  thumbnailUrl: string;
  sources: Source[];
  comments: Comment[];
  tags: string[];
  viewCount: number;
};
