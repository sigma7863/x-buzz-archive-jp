# Xバズアーカイブ

X（旧Twitter）の日本語投稿で **いいね1000以上** のものを、日付単位で集めた静的サイトです。
ジャンル分けは後付け（今は日付軸で運用）。

- フォルダ名: `x-buzz-archive-jp`
- 実行環境: Bun (1.3系) + Next.js 16 (App Router / SSG)
- 収集: ローカルA（Bunスクリプト）→ git push → GitHub Actionsで再ビルド（B）

## クイックスタート

```bash
# 依存インストール
bun install

# 開発サーバー
bun run dev

# サンプルデータで見た目を確認（7日分）
bun run seed
bun run validate
```

開くURL: <http://localhost:3000>

## データの置き方

- `data/YYYY-MM-DD.json` が1日=1ファイルの正本
- スキーマは `src/lib/types.ts` の `BuzzPost` を参照
- `genres: []` は空でOK。ジャンル分けを追加したタイミングで埋めます

例:
```json
{
  "id": "123456",
  "url": "https://x.com/xxx/status/123456",
  "text": "本文...",
  "author": "@xxx",
  "posted_at": "2026-11-08T12:00:00+09:00",
  "likes": 2543,
  "retweets": 412,
  "genres": [],
  "genre_version": null
}
```

## A：ローカル回収（Bun）

```bash
# 昨日分のクエリを出す
bun run collect

# 特定日を指定
bun run collect -- --date 2026-11-08
```

表示されるX検索URLをログイン済みXで開き、手元で取ったJSONを `data/import-YYYY-MM-DD.json` などで保存して取り込み：

```bash
bun run import -- --date 2026-11-08 --file data/import-2026-11-08.json
bun run validate -- --date 2026-11-08
```

> X直スクレイプはログイン済み環境に依存するため、まずは手動＋取り込みの運用にしています。
> 次段階で Playwright 自動取得に差し替える前提です（`scripts/collect.ts` を置換）。

## B：再デプロイ（GitHub Actions）

- `.github/workflows/deploy.yml` で `bun install` → `bun run validate` → `bun run build` を実行
- `main` へ push すると再ビルド（Vercel等がGit連携なら自動デプロイ）
- GitHub Pagesへ出す場合はワークフローのコメントアウト済み手順を有効化

## ページ構成

- `/` : 最新日＋全投稿検索（キーワード・いいね順/投稿日順）
- `/:date` : 日別アーカイブ（例: `/2026-11-08`）、前日/翌日ナビ

## 備考

- サンプルデータは `is_sample: true` 付きで「サンプル」バッジ表示されます
- 遡及はまず7日（2026-11-02〜2026-11-08）で検証→問題なければ30日に拡大
- ジャンルは後付け。`genres` 配列へAI分類結果を入れるだけでUIに反映される実装済み
