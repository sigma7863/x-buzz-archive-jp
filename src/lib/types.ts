// Xバズ投稿の共通型
// ジャンルは後付けのため、genresは空数组でも壊れないようにする
export interface BuzzPost {
  id: string;
  url: string;
  text: string;
  author: string;
  author_url?: string;
  posted_at: string; // ISO文字列
  likes: number;
  retweets: number;
  replies?: number;
  views?: number;
  // 将来のAI分類用
  genres: string[];
  genre_version: string | null;
  is_sample?: boolean;
}

export interface DayArchive {
  date: string; // YYYY-MM-DD
  posts: BuzzPost[];
  count: number;
}
