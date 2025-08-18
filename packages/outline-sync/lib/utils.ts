import fs from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

/**
 * Remove ALL whitespace (space, tab, newline, CR) for comparison.
 * This makes diffs tolerant to formatting differences.
 */
export function normalizeContentIgnoreWhitespace(s: string) {
  return s.replace(/\s+/g, "");
}

export function slugifyTitle(title: string) {
  return title
    .toString()
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 120);
}

export function getGitTimestampMs(filePath: string): number | null {
  try {
    const resolved = path.resolve(filePath);
    const out = spawnSync(
      "git",
      ["log", "-1", "--format=%ct", "--", resolved],
      {
        cwd: process.cwd(),
        encoding: "utf8",
      },
    );
    if (out.status !== 0) return null;
    const txt = (out.stdout || "").trim();
    if (!txt) return null;
    const sec = Number(txt);
    if (Number.isNaN(sec)) return null;
    return sec * 1000;
  } catch {
    return null;
  }
}

export async function getLocalTimestampMs(filePath: string): Promise<number> {
  const gitTs = getGitTimestampMs(filePath);
  if (gitTs) return gitTs;
  const st = await fs.stat(filePath);
  return st.mtimeMs;
}

export async function safeWriteFile(
  filePath: string,
  content: string,
  dryRun = false,
) {
  if (existsSync(filePath)) {
    const bak = `${filePath}.outline-sync.bak.${Date.now()}`;
    if (!dryRun) {
      await fs.copyFile(filePath, bak);
    }
    console.log(`Backed up existing file to ${bak}`);
  } else {
    if (!dryRun) {
      await fs.mkdir(path.dirname(filePath), { recursive: true });
    }
  }
  if (!dryRun) {
    await fs.writeFile(filePath, content, "utf8");
  } else {
    console.log(
      `[dry-run] would write file ${filePath} (${content.length} bytes)`,
    );
  }
}
