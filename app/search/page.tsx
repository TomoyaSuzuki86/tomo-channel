import { Suspense } from "react";
import { RankingSidebar } from "@/components/ranking-sidebar";
import { SearchResults } from "@/components/search-results";

export default function SearchPage() {
  return (
    <main className="mx-auto grid max-w-7xl gap-5 px-4 py-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="space-y-5">
        <Suspense
          fallback={
            <section className="rounded-lg border border-zinc-200 bg-white p-4 shadow-soft sm:p-5">
              <p className="text-sm font-black text-tomo-pink">検索</p>
              <h1 className="mt-1 text-2xl font-black text-zinc-950">記事を探す</h1>
            </section>
          }
        >
          <SearchResults />
        </Suspense>
      </div>
      <RankingSidebar />
    </main>
  );
}
