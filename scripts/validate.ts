// 取り込み済みJSONの検証
//   bun run validate -- --date 2026-11-08
//   bun run validate   # 全日チェック
import { existsSync, readdirSync, readFileSync } from "fs";
import { join } from "path";
import type { BuzzPost } from "../src/lib/types";

function getArg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

const one = getArg("date");
const dir = join(process.cwd(), "data");
if (!existsSync(dir)) {
  console.log("data/ がありません");
  process.exit(0);
}

const files = one
  ? [`${one}.json`]
  : readdirSync(dir)
      .filter((f) => /^\d{4}-\d{2}-\d{2}\.json$/.test(f))
      .sort();

let ok = true;
for (const f of files) {
  const p = join(dir, f);
  if (!existsSync(p)) {
    console.log(`✗ ${f} がありません`);
    ok = false;
    continue;
  }
  try {
    const parsed: unknown = JSON.parse(readFileSync(p, "utf-8"));
    if (!Array.isArray(parsed)) throw new Error("配列ではありません");
    const arr = parsed as BuzzPost[];
    const bad = arr.filter((x) => !(x.id && x.url && x.text && typeof x.likes === "number"));
    if (arr.length === 0) {
      console.log(`- ${f}: 0件`);
    } else if (bad.length > 0) {
      console.log(`✗ ${f}: ${bad.length}件 不正なレコード`);
      ok = false;
    } else {
      const minLikes = Math.min(...arr.map((x) => x.likes));
      const under = arr.filter((x) => x.likes < 1000).length;
      console.log(`✓ ${f}: ${arr.length}件（最小いいね=${minLikes}、1000未満=${under}件）`);
      if (under > 0) ok = false;
    }
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    console.log(`✗ ${f}: ${message}`);
    ok = false;
  }
}
process.exit(ok ? 0 : 1);
