// A：ローカル回収スクリプト（Bun）
// 使い方:
//   bun run collect -- --date 2026-11-08
//   bun run collect   # デフォルトは昨日
//
// 条件: lang:ja + min_faves:1000
// Xの直接スクレイプはログイン済みブラウザ経由が安定するため、
// このスクリプトは:
//   1) 対象クエリを生成
//   2) 手動でブラウザ等から取ったJSON/CSVを受け付ける (scripts/import.ts)
// の責務分離を前提に、クエリ生成 + ファイル検証 + 並び替えまでを担当する。
// 実績: 2026-11 で browse (Chrome) の X検索タブから直接抽出して 7日分 46件 取れた。
// 将来は Playwright でX検索画面の自動取得に差し替える前提。
import { existsSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";

function getArg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

// JSTで昨日を決める（簡易）
function yesterdayJST(): string {
  const d = new Date(Date.now() + 9 * 60 * 60 * 1000);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

function addDay(date: string, days = 1): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

const date = getArg("date") ?? yesterdayJST();
const lang = "ja";
const minFaves = 1000;
const until = addDay(date, 1);

const query = `lang:${lang} min_faves:${minFaves} since:${date} until:${until}`;

console.log("========================================");
console.log(`対象日: ${date}`);
console.log(`条件: ${query}`);
console.log("========================================");
console.log("X検索URL（手動確認用）:");
console.log(`https://x.com/search?q=${encodeURIComponent(query)}&src=typed_query&f=live`);
console.log("");
console.log("手順:");
console.log("1. 上URLをログイン済みXで開いて結果を確認");
console.log("2. 取った投稿をJSONで data/import-YYYY-MM-DD.json に保存（import.tsもOK）");
console.log("   bun run import -- --date 2026-11-08 --file data/import-2026-11-08.json");
console.log("3. bun run validate -- --date 2026-11-08  で取り込み確認");
console.log("========================================");

const file = join(process.cwd(), "data", `${date}.json`);
if (existsSync(file)) {
  try {
    const posts: unknown = JSON.parse(readFileSync(file, "utf-8"));
    console.log(`✓ data/${date}.json 既に存在: ${Array.isArray(posts) ? posts.length : 0}件`);
  } catch {
    console.log(`! data/${date}.json は読めませんでした`);
  }
} else {
  console.log(`- data/${date}.json は未作成（手動取り込み後に作成してください）`);
}

// クエリを .xquery に保存（再現性）
const queryFile = join(process.cwd(), "data", `${date}.xquery`);
writeFileSync(queryFile, `${query}\n`, "utf-8");
console.log(`クエリ保存: data/${date}.xquery`);
