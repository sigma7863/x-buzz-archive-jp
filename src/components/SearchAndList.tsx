"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { BuzzPost } from "@/lib/types";
import { BuzzCard } from "./BuzzCard";

export function SearchAndList({ posts }: { posts: BuzzPost[] }) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"likes" | "date">("likes");

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const base = needle
      ? posts.filter(
          (p) =>
            p.text.toLowerCase().includes(needle) ||
            p.author.toLowerCase().includes(needle) ||
            p.genres.join(" ").toLowerCase().includes(needle)
        )
      : [...posts];
    return base.sort((a, b) =>
      sort === "likes" ? b.likes - a.likes : +new Date(b.posted_at) - +new Date(a.posted_at)
    );
  }, [posts, q, sort]);

  return (
    <section>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold">投稿一覧（{filtered.length}件）</h2>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="キーワードで検索（本文・投稿者）"
            className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-sky-400 dark:border-zinc-800 dark:bg-zinc-950"
          />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as "likes" | "date")}
            className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
          >
            <option value="likes">いいね順</option>
            <option value="date">投稿日順</option>
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-zinc-300 p-8 text-center text-sm text-zinc-500 dark:border-zinc-700">
          条件に合う投稿がありません。検索語を変えてみてください。
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filtered.map((p) => (
            <BuzzCard key={p.id} post={p} />
          ))}
        </div>
      )}

      <p className="mt-6 text-center text-xs text-zinc-500">
        見つかった投稿は{" "}
        <Link href="/" className="underline">
          トップに戻る
        </Link>{" "}
        から日別で確認できます。
      </p>
    </section>
  );
}
