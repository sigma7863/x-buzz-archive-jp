import type { BuzzPost } from "@/lib/types";

function formatNumber(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 1 : 2).replace(/\.00$/, "")}K`;
  return String(n);
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString("ja-JP", {
      timeZone: "Asia/Tokyo",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function BuzzCard({ post }: { post: BuzzPost }) {
  return (
    <article className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950 sm:p-5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <a
          href={post.url}
          target="_blank"
          rel="noopener noreferrer"
          className="line-clamp-1 font-mono text-sm font-medium text-sky-600 hover:underline dark:text-sky-400"
        >
          {post.author}
        </a>
        <time className="shrink-0 text-xs text-zinc-500">{formatDate(post.posted_at)}</time>
      </div>

      <p className="whitespace-pre-wrap text-sm leading-6 text-zinc-800 dark:text-zinc-100">{post.text}</p>

      <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-zinc-500">
        <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2.5 py-1 dark:bg-zinc-800">
          <span className="text-pink-500">♥</span> {formatNumber(post.likes)}
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2.5 py-1 dark:bg-zinc-800">
          🔁 {formatNumber(post.retweets)}
        </span>
        {typeof post.replies === "number" && (
          <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2.5 py-1 dark:bg-zinc-800">
            💬 {formatNumber(post.replies)}
          </span>
        )}
        {post.genres.length > 0 && (
          <span className="inline-flex flex-wrap gap-1">
            {post.genres.map((g) => (
              <span
                key={g}
                className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300"
              >
                {g}
              </span>
            ))}
          </span>
        )}
        {post.is_sample && (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
            サンプル
          </span>
        )}
        <a
          href={post.url}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto font-medium text-sky-600 hover:underline dark:text-sky-400"
        >
          Xで見る →
        </a>
      </div>
    </article>
  );
}
