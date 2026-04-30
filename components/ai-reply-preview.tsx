import { CommentBody } from "@/components/comment-body";
import { formatDateTime } from "@/lib/format";
import type { Comment } from "@/lib/types";

type AiReplyPreviewProps = {
  comment: Comment;
};

export function AiReplyPreview({ comment }: AiReplyPreviewProps) {
  return (
    <div className="rounded-lg border border-pink-100 bg-pink-50/60 p-3 sm:p-4">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
        <span className="font-black text-zinc-950">{comment.displayNo}</span>
        <span className="font-black text-zinc-950">:</span>
        <span className="font-black text-zinc-950">{comment.authorName}</span>
        <time className="font-bold text-zinc-500">{formatDateTime(comment.createdAt)}</time>
        <span className="font-bold text-zinc-500">ID:{comment.shortId}</span>
        {comment.aiGenerated ? (
          <span className="rounded bg-zinc-200 px-1.5 py-0.5 text-[10px] font-black leading-none text-zinc-600">
            AI
          </span>
        ) : null}
      </div>

      <div className="mt-3 pl-0 text-[15px] font-medium leading-8 text-zinc-800 sm:pl-8">
        <CommentBody bodyLines={comment.bodyLines} />
      </div>
    </div>
  );
}
