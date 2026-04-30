import type { ReplyMode } from "@/lib/types";
import { Loader2 } from "lucide-react";

type ThinkingCommentCardProps = {
  label: string;
  replyMode?: ReplyMode;
};

const pulseDots = ["", "animate-pulse", "animate-pulse"];

function getModeHint(replyMode?: ReplyMode) {
  switch (replyMode) {
    case "explain":
      return "やさしく整理中";
    case "fact_check":
      return "事実関係を確認中";
    case "debate":
      return "実装目線で分解中";
    case "joke":
      return "軽めに反応中";
    case "multi":
      return "複数の視点をまとめ中";
    case "single":
    default:
      return "短く返答を整え中";
  }
}

export function ThinkingCommentCard({ label, replyMode }: ThinkingCommentCardProps) {
  return (
    <div className="rounded-lg border border-dashed border-pink-200 bg-pink-50/70 px-4 py-3">
      <div className="flex items-center gap-2 text-sm font-black text-tomo-pink">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>{label}</span>
      </div>
      <div className="mt-2 flex items-center gap-1.5 pl-6">
        {pulseDots.map((className, index) => (
          <span className={`h-2 w-2 rounded-full bg-pink-300 ${className}`} key={`thinking-dot-${index}`} />
        ))}
      </div>
      <p className="mt-2 pl-6 text-xs font-bold text-zinc-500">{getModeHint(replyMode)}</p>
    </div>
  );
}
