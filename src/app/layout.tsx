import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Xバズアーカイブ | 日本語でいいね1000超えの投稿集め",
  description: "X（旧Twitter）で日本語のバズ投稿（いいね1000以上）を日次で集めたアーカイブサイト。",
  openGraph: {
    title: "Xバズアーカイブ",
    description: "日本語でバズっている投稿を「いいね1000以上」だけ集め、日付単位で眺められるサイト。",
    type: "website",
    locale: "ja_JP",
  },
  twitter: {
    card: "summary",
    title: "Xバズアーカイブ",
    description: "日本語バズ投稿（いいね1000+）の日次アーカイブ",
  },
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-zinc-50 text-zinc-900 dark:bg-black dark:text-zinc-100">
        {children}
      </body>
    </html>
  );
}
