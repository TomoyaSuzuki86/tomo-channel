import { CalendarDays, LogIn, Search, UserPlus } from "lucide-react";
import Link from "next/link";
import { categoryNavItems } from "@/lib/content";

export function SiteHeader() {
  return (
    <header className="bg-white shadow-sm">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
        <Link href="/" className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-full border-2 border-pink-200 bg-pink-50 text-2xl">
            と
          </div>
          <div>
            <p className="text-2xl font-black tracking-normal text-tomo-ink">ともちゃんねる</p>
            <p className="text-xs font-bold text-zinc-500">ともに話そう、ニュースのこと</p>
          </div>
        </Link>

        <div className="flex w-full flex-col gap-3 sm:flex-row lg:max-w-3xl">
          <form action="/search" className="relative flex-1">
            <label className="sr-only" htmlFor="header-search-query">
              キーワードで検索
            </label>
            <input
              className="h-11 w-full rounded-lg border border-zinc-200 bg-zinc-50 pl-4 pr-24 text-sm outline-none transition focus:border-tomo-pink focus:bg-white focus:ring-4 focus:ring-pink-100"
              id="header-search-query"
              name="q"
              placeholder="キーワードで検索"
              type="search"
            />
            <button
              className="absolute right-2 top-1/2 inline-flex h-8 -translate-y-1/2 items-center gap-1 rounded-md bg-zinc-950 px-3 text-xs font-black text-white hover:bg-zinc-800"
              type="submit"
            >
              <Search className="h-4 w-4" />
              検索
            </button>
          </form>
          <div className="flex gap-2">
            <Link
              className="inline-flex h-11 items-center gap-1.5 rounded-lg px-3 text-sm font-bold text-zinc-800 hover:bg-zinc-100"
              href="/archive"
              prefetch={false}
            >
              <CalendarDays className="h-4 w-4" />
              アーカイブ
            </Link>
            <button className="inline-flex h-11 items-center gap-1.5 rounded-lg px-3 text-sm font-bold text-zinc-800 hover:bg-zinc-100">
              <LogIn className="h-4 w-4" />
              ログイン
            </button>
            <button className="inline-flex h-11 items-center gap-1.5 rounded-lg px-3 text-sm font-bold text-zinc-800 hover:bg-zinc-100">
              <UserPlus className="h-4 w-4" />
              新規登録
            </button>
            <button className="h-11 rounded-lg bg-tomo-pink px-4 text-sm font-bold text-white shadow-sm hover:bg-pink-500">
              コメントする
            </button>
          </div>
        </div>
      </div>

      <nav className="bg-zinc-950">
        <div className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4">
          {categoryNavItems.map((item) => (
            <Link
              className="whitespace-nowrap px-5 py-3 text-sm font-bold text-white/90 hover:bg-white/10"
              href={item.href}
              key={item.label}
              prefetch={false}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}
