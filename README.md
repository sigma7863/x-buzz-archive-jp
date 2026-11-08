# Xバズアーカイブ

X（旧Twitter）の日本語投稿で **いいね1000以上** のものを、日付単位で集めた静的サイトです。
ジャンルは自動分類（キーワード `v1` / LLM `v2`）で絞り込めます。

- フォルダ名: `x-buzz-archive-jp`
- 実行環境: Bun (1.3系) + Next.js 16 (App Router / SSG)
- 収集: ローカルA（Bunスクリプト + ChromeのX検索タブから直接抽出）→ git push → GitHub Actions/Vercelで再ビルド（B）
- 公開先: https://x-buzz-archive-jp.vercel.app （Vercel 200確認済み）

## クイックスタート

```bash
# 依存インストール
bun install

# 開発サーバー
bun run dev

# 開発用サンプルで見た目を確認（7日分）
bun run seed
bun run validate
bun run tag
```

開くURL: <http://localhost:3000>

## データの置き方

- `data/YYYY-MM-DD.json` が1日=1ファイルの正本
- スキーマは `src/lib/types.ts` の `BuzzPost` を参照
- `genres` は `bun run tag` で自動分類（`v1-keyword`）。APIキー不要のキーワード方式

## A：ローカル回収（Bun）

```bash
# 昨日分のクエリを出す
bun run collect

# 特定日を指定
bun run collect -- --date 2026-11-08
```

表示されるX検索URLをログイン済みXで開く。実績として **2026-10-10〜2026-11-08 の30日分183件** をChromeのタブから直接抽出して実データ化済み（sampleではない）。

次の日も同じ手順：

```bash
bun run import -- --date 2026-11-09 --file data/import-2026-11-09.json
bun run validate -- --date 2026-11-09
bun run tag -- --date 2026-11-09
```

### 無人化（Playwright + cron）

ChromeプロファイルがXにログイン済みなら、無人で回せます：

```bash
bun add -d playwright
bunx playwright install chromium
X_PROFILE=~/.config/google-chrome bun run collect:pw -- --date 2026-11-09
bun run tag -- --date 2026-11-09
bun run validate -- --date 2026-11-09
git add data && git commit -m "data: 2026-11-09" && git push
```

cron例（毎日09:00 JST）：

```
0 9 * * * cd /path/to/x-buzz-archive-jp && X_PROFILE=~/.config/google-chrome bun run collect:pw && bun run tag && bun run validate && git add data && git commit -m "data: daily" && git push
```

> X直スクレイプはログイン済み環境に依存するため、完全自動はローカルcron前提です。GitHub Actions側は build のみ自動（収集はローカル）。

## ジャンル分類

- キーワード版（デフォルト）: `bun run tag`（APIキー不要、`v1-keyword`）
- LLM版: `LLM_API_KEY=xxx bun run tag:llm`（OpenAI互換、`LLM_MODEL`/`LLM_BASE_URL` で変更可、`v2-llm`）
  - キーが無い場合は自動でキーワード版にフォールバック

既存ジャンル：日常系 / ゲーム / アニメ・漫画 / 音楽・芸能 / 政治・社会 / 創作・イラスト / テクノロジー / グルメ・生活

## B：再デプロイ（GitHub Actions）

- `.github/workflows/deploy.yml` で `bun install` → `bun run validate` → `bun run build` を実行
- `main` へ push すると再ビルド（VercelがGit連携で自動デプロイ）
- 毎日09:00 JST（UTC 00:00）に日次スケジュールでbuildチェック

## ページ構成

- `/` : 最新日＋全投稿検索（キーワード・いいね順/投稿日順・ジャンル絞り込み）
- `/:date` : 日別アーカイブ（例: `/2026-11-08`）、前日/翌日ナビ

## 備考

- サイトはVercelに公開済み（`https://x-buzz-archive-jp.vercel.app` 200確認済み）
- ジャンルは `genres` に入れるだけでUIに反映される実装済み
- コンソールの `window.ethereum` エラーはブラウザ拡張（Clover）のもの。サイトと無関係
