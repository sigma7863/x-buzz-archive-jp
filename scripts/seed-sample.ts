// サンプルデータ生成（開発用）
// 本物のX投稿は「bun run collect」で蓄積する想定。ここでは様子見用のモックを出す。
import { mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import type { BuzzPost } from "../src/lib/types";

const DATA = join(process.cwd(), "data");
mkdirSync(DATA, { recursive: true });

function mk(id: string, text: string, likes: number, retweets: number, posted_at: string): BuzzPost {
  return {
    id,
    url: `https://x.com/example/status/${Math.floor(1000000000000000000 + Math.random() * 9e18)}`,
    text,
    author: `@${id}`,
    author_url: `https://x.com/${id}`,
    posted_at,
    likes,
    retweets,
    replies: Math.floor(likes / 10),
    views: likes * 120,
    genres: [],
    genre_version: null,
    is_sample: true,
  };
}

const samples: Record<string, BuzzPost[]> = {
  "2026-11-02": [
    mk("demo_0001", "今日は完全に詰んだ。あと1週間で期末なのに、資料が1枚もできてない。", 3421, 512, "2026-11-02T09:12:00+09:00"),
    mk("demo_0002", "ラーメン二郎松戸店、開店から1時間で完売なのさすが過ぎる。豚が別格だった。", 2890, 410, "2026-11-02T13:40:00+09:00"),
    mk("demo_0003", "生成AIで朝ドラの紹介ポスターを作ってみた。色味がマジで良い。", 1987, 301, "2026-11-02T18:02:00+09:00"),
  ],
  "2026-11-03": [
    mk("demo_0004", "雨の日の登山はやめろと朝から言ったのに、頂上はガスで何も見えなかった。でも遭難しなくてよかった。", 4123, 698, "2026-11-03T08:20:00+09:00"),
    mk("demo_0005", "駅のベンチで寝てたおばちゃんが「元気出して」ってお茶をくれた。日本って優しい。", 2566, 389, "2026-11-03T16:15:00+09:00"),
  ],
  "2026-11-04": [
    mk("onAir_001", "今夜のライブ配信、チャットが止まらなくて面白い。", 5021, 901, "2026-11-04T21:00:00+09:00"),
    mk("demo_0006", "React Router v7のSSR、やっぱり直感的だな。", 1234, 180, "2026-11-04T11:33:00+09:00"),
  ],
  "2026-11-05": [
    mk("demo_0007", "新幹線の車内販売、久しぶりに来たらアイスの種類が増えてた。", 1678, 210, "2026-11-05T10:05:00+09:00"),
    mk("demo_0008", "「ジャンル分けが後」と言われて1週間迷う系ジョークが刺さる。", 2345, 333, "2026-11-05T19:48:00+09:00"),
  ],
  "2026-11-06": [
    mk("demo_0009", "深夜のコンビニ、焼き芋が40%引きで買えた。", 3120, 445, "2026-11-06T23:10:00+09:00"),
    mk("chef_010", "自家製パン。粉の配合を変えたらふわふわになった。", 1456, 201, "2026-11-06T07:30:00+09:00"),
  ],
  "2026-11-07": [
    mk("demo_0010", "今日のツイートが全部刺さった日。ありがとうみんな。", 6789, 1123, "2026-11-07T20:00:00+09:00"),
    mk("demo_0011", "0円投資の罠、やっぱり勉強になった。", 2987, 402, "2026-11-07T15:22:00+09:00"),
  ],
  "2026-11-08": [
    mk("demo_0012", "日曜日出勤のスタバが混みすぎてリモートに戻りたくなった。", 1890, 256, "2026-11-08T09:45:00+09:00"),
    mk("demo_0013", "AIが書いた詩がエモくて泣いた。", 5432, 789, "2026-11-08T22:15:00+09:00"),
  ],
};

for (const [date, posts] of Object.entries(samples)) {
  writeFileSync(join(DATA, `${date}.json`), JSON.stringify(posts, null, 2) + "\n", "utf-8");
  console.log(`seed ${date}.json (${posts.length}件)`);
}
