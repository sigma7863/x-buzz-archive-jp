import Link from "next/link";
import { SearchAndList } from "@/components/SearchAndList";
import { getAllArchives, getAllPosts, getStats } from "@/lib/data";

export default function Home() {
  const archives = getAllArchives();
  const allPosts = getAllPosts();
  const stats = getStats();

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4">
      <header className="border-b border-zinc-200 py-8 dark:border-zinc-800">
        <p className="text-xs font-semibold tracking-widest text-sky-600 dark:text-sky-400">X BUZZ ARCHIVE JP</p>
        <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Xバズアーカイブ</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600 dark:text-zinc-400">
          日本語でバズっている投稿を「いいね1000以上」だけ集め、日付単位で眺められるサイト。ジャンル分けは準備中（今は日付軸で運用）。
        </p>

        <div className="mt-5 grid grid-cols-3 gap-3 max-w-lg">
          <div className="rounded-2xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-950">
            <p className="text-xl font-bold">{stats.days}</p>
            <p className="text-xs text-zinc-500">アーカイブ日数</p>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-950">
            <p className="text-xl font-bold">{stats.posts}</p>
            <p className="text-xs text-zinc-500">収集投稿数</p>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-950">
            <p className="text-xl font-bold">{stats.latestDate ?? "—"}</p>
            <p className="text-xs text-zinc-500">最新収集日</p>
          </div>
        </div>

        <nav className="mt-6 flex flex-wrap gap-2">
          {archives.map((a) => (
            <Link
              key={a.date}
              href={`/${a.date}`}
              className="rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900"
            >
              {a.date}（{a.count}件）
            </Link>
          ))}
        </nav>
      </header>

      <main className="flex-1 py-8">
        {allPosts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-300 p-10 text-center dark:border-zinc-700">
            <p className="font-semibold">まだデータがありません</p>
            <p className="mt-2 text-sm text-zinc-500">
              `data/YYYY-MM-DD.json` を置くか、<code className="rounded bg-zinc-100 px-1">bun run seed</code> でサンプルを生成してください。
            </p>
          </div>
        ) : (
          <>
            <p className="mb-4 text-xs text-zinc-500">
              最新日（{archives[0]?.date}）から表示中。日付ナビで過去も見られます。ジャンルは後付けで追加予定。
            </p>
            <SearchAndList posts={allPosts} />
          </>
        )}
      </main>

      <footer className="border-t border-zinc-200 py-6 text-xs text-zinc-500 dark:border-zinc-800">
        <p>Xバズアーカイブは学習・観測用の非公式アーカイブです。投稿は元ポストへのリンクからご確認ください。</p>
      </footer>
    </div>
  );
}
