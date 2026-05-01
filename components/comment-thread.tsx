"use client";

import { Flag, Heart, RefreshCw, Reply, Send } from "lucide-react";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { AiReplyPreview } from "@/components/ai-reply-preview";
import { CommentBody } from "@/components/comment-body";
import { ThinkingCommentCard } from "@/components/thinking-comment-card";
import { formatDateTime } from "@/lib/format";
import { buildMockReplyPlan, materializeReplyDrafts } from "@/lib/reply-generator";
import type { Comment } from "@/lib/types";

type CommentThreadProps = {
  articleId: string;
  dbBackedMode?: boolean;
  initialComments: Comment[];
};

type PendingReply = {
  anchorDisplayNo: number;
  label: string;
  replyMode: Comment["replyMode"];
};

type CommentApiResponse = {
  ok: boolean;
  error?: string;
  comment?: Comment;
  aiReplyJob?: {
    id: string;
    status: string;
  };
};

type CommentListApiResponse = {
  ok: boolean;
  error?: string;
  comments?: Comment[];
};

const DB_POLL_INTERVAL_MS = 3000;
const DB_POLL_MAX_ATTEMPTS = 8;

function sortComments(comments: Comment[]) {
  return [...comments].sort((first, second) => first.displayNo - second.displayNo);
}

export function CommentThread({ articleId, dbBackedMode = false, initialComments }: CommentThreadProps) {
  const [comments, setComments] = useState<Comment[]>(sortComments(initialComments));
  const [body, setBody] = useState("");
  const [formError, setFormError] = useState("");
  const [formNotice, setFormNotice] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingReplies, setPendingReplies] = useState<PendingReply[]>([]);
  const timerIdsRef = useRef<number[]>([]);

  const nextDisplayNo = useMemo(
    () => comments.reduce((max, comment) => Math.max(max, comment.displayNo), 0) + 1,
    [comments]
  );

  useEffect(
    () => () => {
      timerIdsRef.current.forEach((timerId) => window.clearTimeout(timerId));
    },
    []
  );

  async function fetchComments() {
    const response = await fetch(`/api/comments?articleId=${encodeURIComponent(articleId)}`, {
      method: "GET",
      headers: {
        Accept: "application/json"
      },
      cache: "no-store"
    });
    const payload = (await response.json()) as CommentListApiResponse;

    if (!response.ok || !payload.ok || !payload.comments) {
      throw new Error(payload.error ?? "コメントを更新できませんでした。");
    }

    return sortComments(payload.comments.filter((comment) => comment.articleId === articleId));
  }

  function startDbReplyPolling(anchorDisplayNo: number) {
    let attempt = 0;

    const poll = async () => {
      attempt += 1;

      try {
        const latestComments = await fetchComments();
        const hasNewReplyToAnchor = latestComments.some(
          (comment) => comment.aiGenerated && comment.replyToDisplayNo === anchorDisplayNo
        );

        setComments(latestComments);

        if (hasNewReplyToAnchor) {
          setPendingReplies((current) =>
            current.filter((pending) => pending.anchorDisplayNo !== anchorDisplayNo)
          );
          setFormNotice("AI返信を更新しました。");
          return;
        }

        if (attempt >= DB_POLL_MAX_ATTEMPTS) {
          setFormNotice("返信はまだありません。あとで更新すると反映されます。");
          return;
        }
      } catch {
        if (attempt >= DB_POLL_MAX_ATTEMPTS) {
          setFormNotice("返信の確認に失敗しました。あとで更新してください。");
          return;
        }
      }

      const timerId = window.setTimeout(poll, DB_POLL_INTERVAL_MS);
      timerIdsRef.current.push(timerId);
    };

    const timerId = window.setTimeout(poll, DB_POLL_INTERVAL_MS);
    timerIdsRef.current.push(timerId);
  }

  async function submitToDatabase(trimmed: string) {
    const response = await fetch("/api/comments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        articleId,
        body: trimmed
      })
    });
    const payload = (await response.json()) as CommentApiResponse;

    if (!response.ok || !payload.ok || !payload.comment) {
      throw new Error(payload.error ?? "コメントを投稿できませんでした。");
    }

    const createdComment = payload.comment;

    setComments((current) => sortComments([...current, createdComment]));
    setFormNotice(
      payload.aiReplyJob?.status === "queued"
        ? "投稿しました。スレ民が反応中..."
        : "投稿しました。"
    );
    setBody("");

    if (payload.aiReplyJob?.status === "queued") {
      setPendingReplies((current) => [
        ...current,
        {
          anchorDisplayNo: createdComment.displayNo,
          label: "スレ民が反応中...",
          replyMode: "explain"
        }
      ]);
      startDbReplyPolling(createdComment.displayNo);
    }
  }

  function submitToLocalState(trimmed: string) {
    const now = new Date();
    const replyPlan = buildMockReplyPlan({
      text: trimmed,
      replyToDisplayNo: nextDisplayNo
    });
    const newComment: Comment = {
      id: `local-${now.getTime()}`,
      articleId,
      displayNo: nextDisplayNo,
      replyToDisplayNo: undefined,
      replyMode: "single",
      authorName: "名無しさん",
      authorRole: "読者",
      shortId: `local_${Math.random().toString(36).slice(2, 6)}`,
      bodyLines: trimmed.split(/\r?\n/).filter(Boolean),
      commentType: "user",
      aiGenerated: false,
      createdAt: now.toISOString(),
      likeCount: 0,
      reportCount: 0
    };

    setComments((current) => [...current, newComment]);
    setPendingReplies((current) => [
      ...current,
      {
        anchorDisplayNo: nextDisplayNo,
        label: replyPlan.thinkingLabel,
        replyMode: replyPlan.replyMode
      }
    ]);
    setBody("");

    const timerId = window.setTimeout(() => {
      setComments((current) => {
        const startDisplayNo = current.reduce((max, comment) => Math.max(max, comment.displayNo), 0) + 1;
        const materializedReplies = materializeReplyDrafts({
          articleId,
          parentCommentId: newComment.id,
          replyToDisplayNo: newComment.displayNo,
          startDisplayNo,
          replyDrafts: replyPlan.replyDrafts
        });

        return [...current, ...materializedReplies];
      });

      setPendingReplies((current) => current.filter((pending) => pending.anchorDisplayNo !== newComment.displayNo));
    }, 1200 + Math.floor(Math.random() * 700));

    timerIdsRef.current.push(timerId);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmed = body.trim();
    if (!trimmed || isSubmitting) {
      return;
    }

    setFormError("");
    setFormNotice("");

    if (!dbBackedMode) {
      submitToLocalState(trimmed);
      return;
    }

    setIsSubmitting(true);

    try {
      await submitToDatabase(trimmed);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "コメントを投稿できませんでした。");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleRefreshComments() {
    if (!dbBackedMode) {
      return;
    }

    setFormError("");

    try {
      const latestComments = await fetchComments();
      setComments(latestComments);
      setFormNotice("コメントを更新しました。");
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "コメントを更新できませんでした。");
    }
  }

  return (
    <section className="rounded-lg border border-zinc-200 bg-white shadow-soft">
      <div className="flex flex-col gap-3 border-b border-zinc-200 p-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="flex items-center gap-2 text-xl font-black">
          <span className="text-zinc-950">{comments.length}件のコメント</span>
        </h2>
        <div className="flex gap-2">
          <button className="inline-flex h-9 items-center gap-1 rounded-md border border-zinc-200 px-3 text-xs font-black text-zinc-700 hover:bg-zinc-50">
            新着順
          </button>
          <button
            className="inline-flex h-9 items-center gap-1 rounded-md border border-zinc-200 px-3 text-xs font-black text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:text-zinc-300"
            disabled={!dbBackedMode}
            onClick={handleRefreshComments}
            type="button"
          >
            <RefreshCw className="h-4 w-4" />
            更新
          </button>
        </div>
      </div>

      <form className="grid gap-3 border-b border-zinc-200 p-4 sm:grid-cols-[48px_1fr_auto]" onSubmit={handleSubmit}>
        <div className="hidden h-12 w-12 place-items-center rounded-full bg-zinc-100 text-xl font-black text-zinc-400 sm:grid">
          匿
        </div>
        <textarea
          className="min-h-24 rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-sm font-medium leading-7 outline-none transition placeholder:text-zinc-400 focus:border-tomo-pink focus:bg-white focus:ring-4 focus:ring-pink-100 disabled:cursor-not-allowed disabled:bg-zinc-100"
          disabled={isSubmitting}
          maxLength={500}
          onChange={(event) => setBody(event.target.value)}
          placeholder="コメントを入力（この画面だけに一時追加されます）"
          value={body}
        />
        <button
          className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-tomo-pink px-6 text-sm font-black text-white shadow-sm hover:bg-pink-500 disabled:cursor-not-allowed disabled:bg-zinc-300 sm:self-start"
          disabled={isSubmitting}
          type="submit"
        >
          <Send className="h-4 w-4" />
          {isSubmitting ? "投稿中..." : "投稿する"}
        </button>
        {(formError || formNotice) && (
          <p
            className={[
              "text-sm font-bold sm:col-start-2 sm:col-end-4",
              formError ? "text-red-600" : "text-zinc-500"
            ].join(" ")}
          >
            {formError || formNotice}
          </p>
        )}
      </form>

      <ol className="divide-y divide-zinc-200">
        {sortComments(comments).map((comment) => (
          <li className="p-4" key={comment.id}>
            {comment.aiGenerated ? (
              <AiReplyPreview comment={comment} />
            ) : (
              <>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                  <span className="font-black text-zinc-950">{comment.displayNo}</span>
                  <span className="font-black text-zinc-950">:</span>
                  <span className="font-black text-zinc-950">{comment.authorName}</span>
                  <time className="font-bold text-zinc-500">{formatDateTime(comment.createdAt)}</time>
                  <span className="font-bold text-zinc-500">ID:{comment.shortId}</span>
                </div>

                <div className="mt-3 space-y-1 pl-0 text-[15px] font-medium leading-8 text-zinc-800 sm:pl-8">
                  <CommentBody bodyLines={comment.bodyLines} />
                </div>
              </>
            )}

            <div className="mt-3 flex flex-wrap items-center justify-end gap-4 text-xs font-bold text-zinc-500">
              <button className="inline-flex items-center gap-1 hover:text-tomo-pink">
                <Reply className="h-3.5 w-3.5" />
                返信
              </button>
              <button className="inline-flex items-center gap-1 hover:text-tomo-pink">
                <Heart className="h-3.5 w-3.5" />
                いいね {comment.likeCount}
              </button>
              <button className="inline-flex items-center gap-1 hover:text-tomo-pink">
                <Flag className="h-3.5 w-3.5" />
                通報
              </button>
            </div>

            <div className="mt-3 space-y-2 pl-0 sm:pl-8">
              {pendingReplies
                .filter((pendingReply) => pendingReply.anchorDisplayNo === comment.displayNo)
                .map((pendingReply) => (
                  <ThinkingCommentCard
                    key={`${comment.id}-${pendingReply.anchorDisplayNo}`}
                    label={pendingReply.label}
                    replyMode={pendingReply.replyMode}
                  />
                ))}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
