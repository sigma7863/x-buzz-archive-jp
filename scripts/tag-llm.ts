// LLMジャンル分類（OpenAI互換API対応）
// 環境変数:
//   LLM_API_KEY 必須（OpenAI互換のAPIキー）
//   LLM_BASE_URL デフォルト https://api.openai.com/v1
//   LLM_MODEL    デフォルト gpt-4.1-mini
// 使い方:
//   LLM_API_KEY=xxx bun run tag:llm
//   LLM_API_KEY=xxx LLM_MODEL=gpt-4.1 bun run tag:llm -- --date 2026-11-08
//
// APIキーがない場合はキーワード版（scripts/tag.ts）にフォールバックする設計。
// プロンプトは固定：多ラベル分類、既存ジャンルから選ぶか、必要なら「その他」を除いて最大2個。
import { existsSync, readdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import type { BuzzPost } from "../src/lib/types";

const ALLOWED = ["日常系", "ゲーム", "アニメ・漫画", "音楽・芸能", "政治・社会", "創作・イラスト", "テクノロジー", "グルメ・生活"] as const;

function getArg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

const apiKey = process.env.LLM_API_KEY;
const baseUrl = (process.env.LLM_BASE_URL ?? "https://api.openai.com/v1").replace(/\/$/, "");
const model = process.env.LLM_MODEL ?? "gpt-4.1-mini";
const version = getArg("version") ?? "v2-llm";
const onlyDate = getArg("date");

if (!apiKey) {
  console.log("LLM_API_KEY が未設定なので、キーワード版にフォールバックします（bun run tag）");
  const { execSync } = await import("child_process");
  execSync("bun run scripts/tag.ts", { stdio: "inherit" });
  // フォールバック時は version を v1 のままにする（tag.tsが v1-keyword を付ける）
  process.exit(0);
}

async function classify(text: string): Promise<string[]> {
  const prompt = `次のX投稿（日本語）をジャンル分類してください。
選ぶジャンルはこの中から最大2個（なければ空でよい）：${ALLOWED.join("、")}

投稿:
${text.slice(0, 800)}

JSON配列のみで返してください。例: ["ゲーム","日常系"] または []`;
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: "ジャンル分類器。JSONのみ返す。" },
        { role: "user", content: prompt },
      ],
      temperature: 0,
    }),
  });
  if (!res.ok) throw new Error(`LLM API error: ${res.status}`);
  const data = (await res.json()) as { choices: Array<{ message: { content: string } }> };
  const raw = data.choices[0]?.message?.content ?? "[]";
  try {
    const m = raw.match(/\[[^\]]*\]/);
    const arr = JSON.parse(m ? m[0] : "[]") as string[];
    return arr.filter((g): g is (typeof ALLOWED)[number] => (ALLOWED as readonly string[]).includes(g)).slice(0, 2);
  } catch {
    return [];
  }
}

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
    // 既にLLM済みならスキップ（再実行時の無駄回避）
    if (post.genre_version === version) continue;
    const genres = await classify(post.text);
    post.genres = genres;
    post.genre_version = version;
    changed++;
  }
  if (changed > 0) writeFileSync(p, JSON.stringify(posts, null, 2) + "\n", "utf-8");
  console.log(`${f}: ${posts.length}件、${changed}件更新（model=${model}）`);
  total += posts.length;
}
console.log(`完了: ${total}件処理、version=${version}, model=${model}`);
