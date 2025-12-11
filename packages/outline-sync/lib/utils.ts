import fs from "node:fs/promises"
import { existsSync } from "node:fs"
import path from "node:path"
import { spawnSync } from "node:child_process"
import { logger } from "../bin/cli"

/**
 * Remove ALL whitespace (space, tab, newline, CR) for comparison.
 * This makes diffs tolerant to formatting differences.
 */
export function normalizeContentIgnoreWhitespace(s: string) {
  return s.replace(/\s+/g, "")
}

export function slugifyTitle(title: string) {
  return title
    .toString()
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 120)
}

export function getGitTimestampMs(filePath: string): number | null {
  try {
    const resolved = path.resolve(filePath)
    const out = spawnSync("git", ["log", "-1", "--format=%ct", "--", resolved], {
      cwd: process.cwd(),
      encoding: "utf8",
    })
    if (out.status !== 0) {
      logger.debug(`git log returned non-zero status for ${resolved}: ${out.status}`)
      return null
    }
    const txt = (out.stdout || "").trim()
    if (!txt) {
      logger.debug(`git log returned no output for ${resolved}`)
      return null
    }
    const sec = Number(txt)
    if (Number.isNaN(sec)) {
      logger.debug(`git log output not a number for ${resolved}: "${txt}"`)
      return null
    }
    return sec * 1000
  } catch (err) {
    logger.debug(`getGitTimestampMs error for ${filePath}: ${err}`)
    return null
  }
}

export async function getLocalTimestampMs(filePath: string): Promise<number> {
  const gitTs = getGitTimestampMs(filePath)
  if (gitTs) {
    logger.debug(`Using git timestamp for ${filePath}: ${gitTs}`)
    return gitTs
  }
  const st = await fs.stat(filePath)
  logger.debug(`Using FS mtime for ${filePath}: ${st.mtimeMs}`)
  return st.mtimeMs
}

export async function safeWriteFile(filePath: string, content: string, dryRun = false) {
  if (existsSync(filePath)) {
    const bak = `${filePath}.outline-sync.bak.${Date.now()}`
    if (!dryRun) {
      try {
        await fs.copyFile(filePath, bak)
        logger.info(`Backed up existing file to ${bak}`)
      } catch (err) {
        logger.warn(`Failed to back up ${filePath} to ${bak}: ${err}`)
      }
    } else {
      logger.debug(`[dry-run] would backup existing file ${filePath} -> ${bak}`)
    }
  } else {
    if (!dryRun) {
      try {
        await fs.mkdir(path.dirname(filePath), { recursive: true })
        logger.debug(`Ensured directory ${path.dirname(filePath)}`)
      } catch (err) {
        logger.warn(`Failed to create directory ${path.dirname(filePath)}: ${err}`)
      }
    } else {
      logger.debug(`[dry-run] would ensure directory ${path.dirname(filePath)}`)
    }
  }

  if (!dryRun) {
    try {
      await fs.writeFile(filePath, content, "utf8")
      logger.info(`Wrote file ${filePath} (${content.length} bytes)`)
    } catch (err) {
      logger.error(`Failed to write file ${filePath}: ${err}`)
      throw err
    }
  } else {
    logger.debug(`[dry-run] would write file ${filePath} (${content.length} bytes)`)
  }
}
