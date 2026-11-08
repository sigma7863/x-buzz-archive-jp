import Link from "next/link";
import { notFound } from "next/navigation";
import { SearchAndList } from "@/components/SearchAndList";
import { getAllDates, getDayArchive } from "@/lib/data";

export function generateStaticParams() {
  return getAllDates().map((date) => ({ date }));
}

export default async function DatePage({ params }: { params: Promise<{ date: string }> }) {
  const { date } = await params;
  const archive = getDayArchive(date);
  if (!archive) notFound();

  const dates = getAllDates();
  const idx = dates.indexOf(date);
  const prev = idx >= 0 ? dates[idx + 1] : undefined; // より古い
  const next = idx > 0 ? dates[idx - 1] : undefined; // より新しい

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4">
      <header className="border-b border-zinc-200 py-6 dark:border-zinc-800">
        <Link href="/" className="text-sm text-sky-600 hover:underline dark:text-sky-400">
          ← トップへ
        </Link>
        <h1 className="mt-2 text-2xl font-bold">{date} のバズ投稿</h1>
        <p className="mt-1 text-sm text-zinc-500">合計 {archive.count}件（いいね1000以上）</p>

        <nav className="mt-4 flex flex-wrap gap-2">
          {dates.map((d) => (
            <Link
              key={d}
              href={`/${d}`}
              className={[
                "rounded-full border px-3 py-1.5 text-xs font-medium",
                d === date
                  ? "border-sky-600 bg-sky-600 text-white"
                  : "border-zinc-200 bg-white hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900",
              ].join(" ")}
            >
              {d}
            </Link>
          ))}
        </nav>

        <div className="mt-5 flex gap-2 text-sm">
          {prev && (
            <Link href={`/${prev}`} className="rounded-lg border border-zinc-200 px-3 py-2 dark:border-zinc-800">
              ← 前日 {prev}
            </Link>
          )}
          {next && (
            <Link href={`/${next}`} className="rounded-lg border border-zinc-200 px-3 py-2 dark:border-zinc-800">
              翌日 {next} →
            </Link>
          )}
        </div>
      </header>

      <main className="flex-1 py-8">
        <SearchAndList posts={archive.posts} />
      </main>

      <footer className="border-t border-zinc-200 py-6 text-xs text-zinc-500 dark:border-zinc-800">
        <p>Xバズアーカイブ · {date}</p>
      </footer>
    </div>
  );
}
