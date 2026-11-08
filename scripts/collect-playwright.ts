// 無人化用 Playwright 収集（ローカルcron用）
// 前提: パソコンの Chrome プロファイルが X にログイン済みであること。
// 使い方:
//   bun add -d playwright
//   bunx playwright install chromium   # 初回だけ
//   X_PROFILE=~/.config/google-chrome bun run collect:pw -- --date 2026-11-09
//
// 環境変数:
//   X_STORAGE  Playwright storageState JSON（推奨：Browseからexportしたログイン済みCookie）
//   X_PROFILE  Chromeのユーザーデータディレクトリ（レガシー、コピー方式）
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

const storagePath = process.env.X_STORAGE;
const userDataDir = storagePath ? "" : expand(process.env.X_USER_DATA_DIR ?? process.env.X_PROFILE ?? "~/Library/Application Support/Google/Chrome");

if (!storagePath && !existsSync(userDataDir)) {
  console.error(`Chromeプロファイルが見つかりません: ${userDataDir}`);
  console.error("X_STORAGE（BrowseからexportしたstorageState）か、X_PROFILE を指定してください。");
  process.exit(1);
}
if (storagePath && !existsSync(storagePath)) {
  console.error(`storageStateが見つかりません: ${storagePath}`);
  process.exit(1);
}

console.log(`対象日: ${date}`);
console.log(`クエリ: ${query}`);
console.log(`URL: ${url}`);
if (storagePath) console.log(`認証: storageState (${storagePath})`);
else console.log(`プロファイル: ${userDataDir}`);

let browserContext;
let browser;
if (storagePath) {
  browser = await chromium.launch({ headless: false, channel: "chrome" });
  browserContext = await browser.newContext({ storageState: storagePath });
} else {
  browserContext = await chromium.launchPersistentContext(userDataDir, {
    headless: false,
    channel: "chrome",
    ignoreDefaultArgs: ["--use-mock-keychain"],
    args: ["--disable-blink-features=AutomationControlled", "--password-store=keychain"],
  });
  browser = browserContext;
}
const page = await browserContext.newPage();
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
    const txtEl = a.querySelector('[data-testid="tweetText"]') as unknown as HTMLElement | null;
    const txt = txtEl ? txtEl.innerText : "";
    const timeEl = a.querySelector("time");
    const dt = timeEl ? timeEl.getAttribute("datetime") : "";
    const linkEl = a.querySelector('a[href*="/status/"]') as unknown as HTMLAnchorElement | null;
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
  console.log("0件でした（当日早朝などは正常）。空ファイルを作成してパイプラインを続けます。");
  mkdirSync(join(process.cwd(), "data"), { recursive: true });
  writeFileSync(join(process.cwd(), "data", `${date}.json`), "[]\n", "utf-8");
  console.log(`✓ data/${date}.json に 0件 保存`);
  process.exit(0);
}

mkdirSync(join(process.cwd(), "data"), { recursive: true });
writeFileSync(join(process.cwd(), "data", `${date}.json`), JSON.stringify(posts, null, 2) + "\n", "utf-8");
console.log(`✓ data/${date}.json に ${posts.length}件 保存`);
console.log("次: bun run tag && bun run validate && git push");
