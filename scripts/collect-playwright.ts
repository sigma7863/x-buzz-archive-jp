// 無人化用 Playwright 収集（ローカルcron用）
// 前提: パソコンの Chrome プロファイルが X にログイン済みであること。
// 使い方:
//   bun add -d playwright
//   bunx playwright install chromium   # 初回だけ
//   X_PROFILE=~/.config/google-chrome bun run collect:pw -- --date 2026-11-09
//
// 環境変数:
//   X_PROFILE  Chromeのユーザーデータディレクトリ（デフォルト: ~/.config/google-chrome）
//   X_USER_DATA_DIR 同上（X_PROFILEより優先）
//
// 仕組み: 永続コンテキストでX検索画面を開き、DOMから抽出して data/YYYY-MM-DD.json に保存。
// cron例 (毎日09:00 JST):
//   0 9 * * * cd /path/to/x-buzz-archive-jp && X_PROFILE=~/.config/google-chrome bun run collect:pw && bun run tag && bun run validate && git add data && git commit -m "data: daily" && git push
import { chromium } from "playwright";
import { existsSync, mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import { homedir } from "os";
import type { BuzzPost } from "../src/lib/types";

function getArg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

function expand(p: string): string {
  if (p.startsWith("~/")) return join(homedir(), p.slice(2));
  return p;
}

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
const until = addDay(date, 1);
const query = `lang:ja min_faves:1000 since:${date} until:${until}`;
const url = `https://x.com/search?q=${encodeURIComponent(query)}&src=typed_query&f=live`;

const userDataDir = expand(process.env.X_USER_DATA_DIR ?? process.env.X_PROFILE ?? "~/.config/google-chrome");

if (!existsSync(userDataDir)) {
  console.error(`Chromeプロファイルが見つかりません: ${userDataDir}`);
  console.error("X_PROFILE 環境変数でChromeのユーザーデータディレクトリを指定してください。");
  process.exit(1);
}

console.log(`対象日: ${date}`);
console.log(`クエリ: ${query}`);
console.log(`URL: ${url}`);
console.log(`プロファイル: ${userDataDir}`);

const browser = await chromium.launchPersistentContext(userDataDir, {
  headless: false,
  args: ["--disable-blink-features=AutomationControlled"],
});
const page = await browser.newPage();
await page.goto(url, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(6000);
// 少しスクロールして追加読み込み
for (let i = 0; i < 3; i++) {
  await page.evaluate(() => window.scrollBy(0, 800));
  await page.waitForTimeout(1200);
}

const raw = (await page.evaluate(() => {
  const out: Array<{ txt: string; datetime: string; link: string; likes: number; retweets: number; replies: number }> = [];
  document.querySelectorAll("article").forEach((a) => {
    const txtEl = a.querySelector('[data-testid="tweetText"]');
    const txt = txtEl ? txtEl.innerText : "";
    const timeEl = a.querySelector("time");
    const dt = timeEl ? timeEl.getAttribute("datetime") : "";
    const linkEl = a.querySelector('a[href*="/status/"]');
    const link = linkEl ? linkEl.href : "";
    function cnt(tid: string): number {
      const el = a.querySelector(`[data-testid="${tid}"]`);
      if (!el) return 0;
      const aria = el.getAttribute("aria-label") || "";
      const m = aria.match(/[0-9,]+/);
      return m ? parseInt(m[0].replace(/,/g, ""), 10) : 0;
    }
    if (!txt || !link) return;
    out.push({ txt: txt.slice(0, 2000), datetime: dt || "", link, likes: cnt("like"), retweets: cnt("retweet"), replies: cnt("reply") });
  });
  return out;
})) as Array<{ txt: string; datetime: string; link: string; likes: number; retweets: number; replies: number }>;

await browser.close();

const posts: BuzzPost[] = raw
  .filter((p) => p.likes >= 1000 && p.link)
  .map((p) => {
    const id = p.link.split("/").pop() ?? String(Date.now());
    let handle = "";
    try {
      handle = new URL(p.link).pathname.split("/")[1] ?? "";
    } catch {
      handle = "";
    }
    return {
      id,
      url: p.link,
      text: p.txt,
      author: handle ? `@${handle}` : "@unknown",
      author_url: handle ? `https://x.com/${handle}` : undefined,
      posted_at: p.datetime,
      likes: p.likes,
      retweets: p.retweets,
      replies: p.replies,
      genres: [],
      genre_version: null,
    };
  })
  .sort((a, b) => b.likes - a.likes);

if (posts.length === 0) {
  console.error("0件でした。ログイン状態・クエリを確認してください。");
  process.exit(1);
}

mkdirSync(join(process.cwd(), "data"), { recursive: true });
writeFileSync(join(process.cwd(), "data", `${date}.json`), JSON.stringify(posts, null, 2) + "\n", "utf-8");
console.log(`✓ data/${date}.json に ${posts.length}件 保存`);
console.log("次: bun run tag && bun run validate && git push");
