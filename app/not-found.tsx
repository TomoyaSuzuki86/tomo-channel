import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-20 text-center">
      <div className="rounded-lg border border-zinc-200 bg-white p-8 shadow-soft">
        <p className="text-sm font-black text-tomo-pink">404</p>
        <h1 className="mt-2 text-2xl font-black">記事が見つかりません</h1>
        <p className="mt-3 text-sm font-medium leading-7 text-zinc-600">
          指定された記事は削除されたか、URLが変わった可能性があります。
        </p>
        <Link
          className="mt-6 inline-flex h-11 items-center rounded-lg bg-tomo-pink px-5 text-sm font-black text-white"
          href="/"
        >
          トップへ戻る
        </Link>
      </div>
    </main>
  );
}
