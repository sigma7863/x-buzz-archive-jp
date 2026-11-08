import { existsSync, readdirSync, readFileSync } from "fs";
import { join } from "path";
import type { BuzzPost, DayArchive } from "./types";

const DATA_DIR = join(process.cwd(), "data");

function listDayFiles(): string[] {
  if (!existsSync(DATA_DIR)) return [];
  return readdirSync(DATA_DIR)
    .filter((f) => /^\d{4}-\d{2}-\d{2}\.json$/.test(f))
    .sort();
}

function readDay(date: string): BuzzPost[] {
  const file = join(DATA_DIR, `${date}.json`);
  if (!existsSync(file)) return [];
  try {
    const raw = readFileSync(file, "utf-8");
    const parsed = JSON.parse(raw) as BuzzPost[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function getAllDates(): string[] {
  return listDayFiles()
    .map((f) => f.replace(".json", ""))
    .reverse(); // 新しい順
}

export function getDayArchive(date: string): DayArchive | null {
  const posts = readDay(date);
  if (posts.length === 0) return null;
  const sorted = [...posts].sort((a, b) => b.likes - a.likes);
  return { date, posts: sorted, count: sorted.length };
}

export function getAllArchives(): DayArchive[] {
  return getAllDates()
    .map((d) => getDayArchive(d))
    .filter((x): x is DayArchive => x !== null);
}

export function getAllPosts(): BuzzPost[] {
  return getAllArchives().flatMap((a) => a.posts);
}

export function getStats() {
  const archives = getAllArchives();
  const posts = archives.flatMap((a) => a.posts);
  const totalLikes = posts.reduce((s, p) => s + p.likes, 0);
  return {
    days: archives.length,
    posts: posts.length,
    totalLikes,
    latestDate: archives[0]?.date ?? null,
  };
}
