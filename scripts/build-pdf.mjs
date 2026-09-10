#!/usr/bin/env node
// Renders src/cloud-platform-roadmap.html to GardenWise-Cloud-Platform-Roadmap.pdf
// using a locally installed Chrome or Edge in headless mode.
//
//   node scripts/build-pdf.mjs

import { execFileSync } from "node:child_process";
import { existsSync, rmSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, resolve } from "node:path";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const source = resolve(repoRoot, "src/cloud-platform-roadmap.html");
const output = resolve(repoRoot, "GardenWise-Cloud-Platform-Roadmap.pdf");

const candidates = [
  process.env.CHROME_PATH,
  "/usr/local/bin/google-chrome",
  "/usr/bin/google-chrome-stable",
  "/usr/bin/chromium",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
].filter(Boolean);

const browser = candidates.find((p) => existsSync(p));
if (!browser) {
  console.error("No Chrome or Edge found. Set CHROME_PATH to the executable.");
  process.exit(1);
}
if (!existsSync(source)) {
  console.error(`Missing source document: ${source}`);
  process.exit(1);
}

rmSync(output, { force: true });

// Headless Chrome does not always exit after --print-to-pdf, so the write is
// verified separately rather than trusting the process exit code.
try {
  execFileSync(browser, [
    "--headless=new",
    "--no-sandbox",
    "--disable-gpu",
    "--disable-dev-shm-usage",
    "--no-zygote",
    "--hide-scrollbars",
    "--no-pdf-header-footer",
    "--virtual-time-budget=12000",
    `--print-to-pdf=${output}`,
    pathToFileURL(source).href,
  ], { stdio: "ignore", timeout: 120_000 });
} catch {
  /* exit code and timeouts are both expected; the check below is what matters */
}

if (!existsSync(output)) {
  console.error("Render failed: no PDF was produced.");
  process.exit(1);
}
console.log(`Wrote ${output}`);
