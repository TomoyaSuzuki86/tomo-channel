import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-12 bg-zinc-950 text-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-7 md:flex-row md:items-center md:justify-between">
        <Link href="/" className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-full bg-white text-lg text-tomo-pink">
            と
          </div>
          <span className="text-lg font-black">ともちゃんねる</span>
        </Link>
        <div className="flex flex-wrap gap-x-7 gap-y-2 text-sm font-bold text-white/75">
          <span>利用規約</span>
          <span>プライバシーポリシー</span>
          <span>お問い合わせ</span>
          <span>広告掲載について</span>
        </div>
        <p className="text-sm text-white/60">© 2026 Tomo Channel</p>
      </div>
    </footer>
  );
}
