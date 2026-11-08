#!/usr/bin/env bash
set -euo pipefail

# A: ローカル日次バッチ
# 使い方:
#   bun run daily:check   # 昨日分のクエリ発行 + 検証のみ
#   bun run daily         # クエリ発行 + validate + push (import済みが前提)
# import自体は手動（Xログイン済みブラウザでJSONを作る）なので、ここでは
# collect -> validate -> git commit/push までを一気通貫する。

DATE="${1:-$(date -v-1d +%F 2>/dev/null || date -d '1 day ago' +%F)}"
echo "== daily: ${DATE} =="

bun run collect -- --date "${DATE}"
bun run validate -- --date "${DATE}"

# 変更があればコミットしてpush
if git diff --quiet -- "data/${DATE}.json"; then
  echo "変更なし（import未実施 or 既に取り込み済み）"
  exit 0
fi

git add "data/${DATE}.json"
git commit -m "data: ${DATE} バズ投稿（いいね1000+）"
git push
echo "✓ push完了（Vercel再デプロイが走ります）"
