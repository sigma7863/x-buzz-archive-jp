import { chromium } from "playwright";
const userDataDir = "/tmp/x-buzz-chrome";
const browser = await chromium.launchPersistentContext(userDataDir, {
  headless: false,
  channel: "chrome",
  ignoreDefaultArgs: ["--use-mock-keychain"],
  args: ["--password-store=keychain"],
});
const page = await browser.newPage();
await page.goto("https://x.com/search?q=lang%3Aja%20min_faves%3A1000%20since%3A2026-11-08%20until%3A2026-11-09&src=typed_query&f=live", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(7000);
const info = await page.evaluate(() => ({
  url: location.href,
  title: document.title,
  articles: document.querySelectorAll("article").length,
  text: document.body ? document.body.innerText.slice(0, 1200) : "",
}));
console.log(JSON.stringify(info, null, 2));
await browser.close();
