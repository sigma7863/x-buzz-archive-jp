// 手動取ったJSON/CSVを取り込み用に整形する
//   bun run import -- --date 2026-11-08 --file ./import.json
//   bun run import -- --date 2026-11-08 --file ./import.json --replace  # 上書き
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import type { BuzzPost } from "../src/lib/types";

function getArg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

const date = getArg("date") ?? new Date().toISOString().slice(0, 10);
const file = getArg("file");
const replace = process.argv.includes("--replace");

if (!file || !existsSync(file)) {
  console.error("使い方: bun run import -- --date YYYY-MM-DD --file ./import.json [--replace]");
  process.exit(1);
}

const raw = readFileSync(file, "utf-8");
let parsed: unknown;
try {
  parsed = JSON.parse(raw);
} catch {
  console.error("importファイルはJSONである必要があります");
  process.exit(1);
}

const arr = Array.isArray(parsed) ? (parsed as Record<string, unknown>[]) : [parsed as Record<string, unknown>];
if (arr.length === 0) {
  console.error("投稿が0件です");
  process.exit(1);
}

const out = join(process.cwd(), "data", `${date}.json`);
mkdirSync(join(process.cwd(), "data"), { recursive: true });
if (existsSync(out) && !replace) {
  console.error(`data/${date}.json は既に存在します。上書きするには --replace を付けてください`);
  process.exit(1);
}

function asString(v: unknown, fallback: string): string {
  return typeof v === "string" && v.length > 0 ? v : fallback;
}

// 最低限の正規化
const normalized: BuzzPost[] = arr
  .map((p) => {
    const url = typeof p.url === "string" ? p.url : `https://x.com/${String(p.author ?? "unknown")}/status/${String(p.id ?? Date.now())}`;
    const post: BuzzPost = {
      id: asString(p.id, url.split("/").pop() ?? String(Date.now())),
      url,
      text: asString(p.text, ""),
      author: asString(p.author, "@unknown"),
      author_url: typeof p.author_url === "string" ? p.author_url : undefined,
      posted_at: asString(p.posted_at, `${date}T00:00:00+09:00`),
      likes: Number(p.likes ?? 0),
      retweets: Number(p.retweets ?? 0),
      replies: typeof p.replies === "number" ? p.replies : undefined,
      views: typeof p.views === "number" ? p.views : undefined,
      genres: Array.isArray(p.genres) ? (p.genres as unknown[]).map(String) : [],
      genre_version: typeof p.genre_version === "string" ? p.genre_version : null,
      is_sample: Boolean(p.is_sample ?? false),
    };
    return post;
  })
  .filter((p) => p.likes >= 1000)
  .sort((a, b) => b.likes - a.likes);

if (normalized.length === 0) {
  console.error("いいね1000以上の投稿がありませんでした");
  process.exit(1);
}

writeFileSync(out, JSON.stringify(normalized, null, 2) + "\n", "utf-8");
console.log(`✓ data/${date}.json に ${normalized.length}件 取り込みました（いいね順にソート済）`);
console.log("→ B（GitHub Actionsで再デプロイ）に繋げるには git push してください");
