import Link from "next/link";
import { ChevronRight, Flame, Hash, Info, Megaphone } from "lucide-react";
import { rankingArticles } from "@/lib/mock-data";

const keywords = ["AI", "生活メモ", "家計", "地域", "学び直し", "予定共有", "掲示板", "朝刊"];

export function RankingSidebar() {
  return (
    <aside className="space-y-4">
      <section className="rounded-lg border border-zinc-200 bg-white p-4 shadow-soft">
        <div className="mb-4 flex items-center gap-2">
          <Flame className="h-5 w-5 text-tomo-pink" />
          <h2 className="text-lg font-black">リアルタイムランキング</h2>
        </div>
        <div className="grid grid-cols-3 rounded-md border border-zinc-200 text-center text-xs font-bold text-zinc-500">
          <span className="border-r border-zinc-200 py-2 text-zinc-950">24時間</span>
          <span className="border-r border-zinc-200 py-2">週間</span>
          <span className="py-2">月間</span>
        </div>
        <ol className="mt-4 space-y-4">
          {rankingArticles.slice(0, 5).map((article, index) => (
            <li className="grid grid-cols-[28px_1fr] gap-3" key={article.id}>
              <span
                className={[
                  "grid h-6 w-6 place-items-center rounded text-xs font-black text-white",
                  index === 0 ? "bg-amber-400" : index === 1 ? "bg-blue-500" : index === 2 ? "bg-orange-400" : "bg-zinc-400"
                ].join(" ")}
              >
                {index + 1}
              </span>
              <Link href={`/articles/${article.slug}`} className="group">
                <p className="line-clamp-2 text-sm font-black leading-6 group-hover:text-tomo-pink">
                  {article.title}
                </p>
                <p className="mt-1 text-right text-xs font-bold text-tomo-pink">
                  {article.comments.length || Math.floor(article.viewCount / 210)}コメント
                </p>
              </Link>
            </li>
          ))}
        </ol>
        <button className="mt-5 h-10 w-full rounded-md border border-zinc-200 text-sm font-black text-zinc-700 hover:bg-zinc-50">
          もっと見る
        </button>
      </section>

      <section className="rounded-lg border border-zinc-200 bg-white p-4 shadow-soft">
        <div className="mb-4 flex items-center gap-2">
          <Hash className="h-5 w-5 text-tomo-pink" />
          <h2 className="text-lg font-black">人気のキーワード</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {keywords.map((keyword) => (
            <span className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-bold" key={keyword}>
              {keyword}
            </span>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-zinc-200 bg-white p-4 shadow-soft">
        <div className="mb-3 flex items-center gap-2">
          <Info className="h-5 w-5 text-tomo-pink" />
          <h2 className="text-lg font-black">ともちゃんねるについて</h2>
        </div>
        <p className="text-sm font-medium leading-7 text-zinc-700">
          ともちゃんねるは、ニュースをみんなで楽しく語り合うためのまとめ・掲示板風サイトです。
        </p>
        <button className="mt-4 inline-flex h-10 w-full items-center justify-center gap-1 rounded-md bg-tomo-pink text-sm font-black text-white">
          詳しくはこちら
          <ChevronRight className="h-4 w-4" />
        </button>
      </section>

      <section className="rounded-lg border border-zinc-200 bg-white p-4 shadow-soft">
        <div className="mb-4 flex items-center gap-2">
          <Megaphone className="h-5 w-5 text-tomo-pink" />
          <h2 className="text-lg font-black">お知らせ</h2>
        </div>
        <ul className="space-y-3 text-sm font-bold text-blue-700">
          <li>2026/04/30 UIモック版を準備中</li>
          <li>2026/04/29 コメント表示ルールを整理</li>
          <li>2026/04/28 朝刊ニュース板を追加</li>
        </ul>
      </section>
    </aside>
  );
}
