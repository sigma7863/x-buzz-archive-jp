// ジャンル自動分類（キーワードルール）
// AI APIキーなしで完結する決定版。後からLLM化したければこのスクリプトを差し替え。
// 使い方:
//   bun run tag                # data/*.json 全件
//   bun run tag -- --date 2026-11-08
//   bun run tag -- --version v1
import { existsSync, readdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import type { BuzzPost } from "../src/lib/types";

type GenreDef = { name: string; keywords: string[] };

const GENRES: GenreDef[] = [
  { name: "日常系", keywords: ["おやすみ", "おはよう", "今日も", "ありがとう", "のんびり", "ねんね"] },
  { name: "ゲーム", keywords: ["Switch", "ポケモンGO", "pokemongo", "ホラーゲーム", "クトゥルフ", "TRPG", "シナリオ", "時オカリ", "ゼルダ", "Ocarina"] },
  { name: "アニメ・漫画", keywords: ["デク", "緑谷出久", "コナ", "超特急", "アロハル", "VIVANT", "悪役会議室"] },
  { name: "音楽・芸能", keywords: ["Vaundy", "MAZZEL", "バズリズム", "LIVE", "ツアー", "配信", "NHK", "ディズニー", "タワー・オブ・テラー"] },
  { name: "政治・社会", keywords: ["国会議員", "文化の日", "明治の日", "ロシア", "北朝鮮", "中国", "軍事力", "資産", "非友好国"] },
  { name: "創作・イラスト", keywords: ["絵", "描いて", "创作", "創作BL", "ピアス", "悩", "つ百", "落書き", "ねんねのじかん"] },
  { name: "テクノロジー", keywords: ["ツイキャス", "サービス", "再開", "Web版"] },
  { name: "グルメ・生活", keywords: ["CM", "マクドナルド", "内装", "お金", "おやすみ"] },
];

function classify(text: string): string[] {
  const t = text.toLowerCase();
  const hits: string[] = [];
  for (const g of GENRES) {
    if (g.keywords.some((k) => t.includes(k.toLowerCase()))) hits.push(g.name);
  }
  return hits;
}

function getArg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

const version = getArg("version") ?? "v1-keyword";
const onlyDate = getArg("date");

const dir = join(process.cwd(), "data");
const files = onlyDate
  ? [`${onlyDate}.json`]
  : readdirSync(dir)
      .filter((f) => /^\d{4}-\d{2}-\d{2}\.json$/.test(f))
      .sort();

let total = 0;
for (const f of files) {
  const p = join(dir, f);
  if (!existsSync(p)) continue;
  const posts = JSON.parse(readFileSync(p, "utf-8")) as BuzzPost[];
  let changed = 0;
  for (const post of posts) {
    const genres = classify(post.text);
    if (genres.length > 0 && (post.genres.join() !== genres.join() || post.genre_version !== version)) {
      post.genres = genres;
      post.genre_version = version;
      changed++;
    } else if (post.genres.length === 0 && post.genre_version !== version) {
      post.genre_version = version;
      changed++;
    }
  }
  if (changed > 0) {
    writeFileSync(p, JSON.stringify(posts, null, 2) + "\n", "utf-8");
  }
  console.log(`${f}: ${posts.length}件、${changed}件更新`);
  total += posts.length;
}
console.log(`完了: ${total}件処理、version=${version}`);
