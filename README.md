# Xバズアーカイブ

X（旧Twitter）の日本語投稿で **いいね1000以上** のものを、日付単位で集めた静的サイトです。
ジャンルは自動分類（キーワード）で後付け済み、サイト側で絞り込めます。

- フォルダ名: `x-buzz-archive-jp`
- 実行環境: Bun (1.3系) + Next.js 16 (App Router / SSG)
- 収集: ローカルA（Bunスクリプト + ChromeのX検索タブから直接抽出）→ git push → GitHub Actionsで再ビルド（B）

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

表示されるX検索URLをログイン済みXで開く。実績として 2026-11 で **7日分46件（11/02 7件・11/03 5件・11/04 6件・11/05 8件・11/06 6件・11/07 5件・11/08 9件）** をChromeのタブから直接抽出して実データ化済み（sampleではない）。

次の日も同じ手順：

```bash
bun run import -- --date 2026-11-09 --file data/import-2026-11-09.json
bun run validate -- --date 2026-11-09
bun run tag -- --date 2026-11-09
```

> X直スクレイプはログイン済み環境に依存するため、まずは手動＋取り込みの運用にしています。
> 次段階で Playwright 自動取得に差し替える前提です（`scripts/collect.ts` を置換）。

## B：再デプロイ（GitHub Actions）

- `.github/workflows/deploy.yml` で `bun install` → `bun run validate` → `bun run build` を実行
- `main` へ push すると再ビルド（Vercel等がGit連携なら自動デプロイ）
- 毎日09:00 JST（UTC 00:00）に日次スケジュールでbuildチェック

## ページ構成

- `/` : 最新日＋全投稿検索（キーワード・いいね順/投稿日順・ジャンル絞り込み）
- `/:date` : 日別アーカイブ（例: `/2026-11-08`）、前日/翌日ナビ

## 備考

- サイトはVercelに公開済み。GitHub push → 自動で再デプロイ
- ジャンルは `genres` にAI/ルールで入れるだけでUIに反映される実装済み
- コンソールの `window.ethereum` エラーはブラウザ拡張（Clover）のもの。サイトと無関係
