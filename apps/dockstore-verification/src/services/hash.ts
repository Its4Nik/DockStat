import BaseLogger from "../base-logger"

const logger = BaseLogger.spawn("Hash-Service")
import { hashString } from "@dockstat/utils"

/**
 * Hash a file using SHA-256
 */
export async function hashFile(filePath: string): Promise<string> {
  try {
    const file = Bun.file(filePath)
    const content = await file.text()
    return hashString(content)
  } catch (error) {
    logger.error(
      `Failed to hash file: ${filePath}`,
      error instanceof Error ? error.message : String(error)
    )
    throw new Error(`Failed to hash file: ${filePath}`)
  }
}

/**
 * Hash multiple files and return combined hash
 */
export async function hashFiles(filePaths: string[]): Promise<string> {
  const hashes = await Promise.all(filePaths.map((path) => hashFile(path)))
  const combined = hashes.sort().join("")
  return hashString(combined)
}

/**
 * Hash a plugin bundle (index.ts + any additional source files)
 */
export async function hashPluginBundle(pluginPath: string): Promise<{
  sourceHash: string
  bundleHash?: string
}> {
  const glob = new Bun.Glob("**/*.{ts,tsx,js,jsx}")
  const sourceFiles: string[] = []

  for await (const file of glob.scan({ cwd: pluginPath, absolute: true })) {
    // Exclude generated files
    if (!file.includes("/bundle/") && !file.includes("/dist/") && !file.includes("manifest.ts")) {
      sourceFiles.push(file)
    }
  }

  const sourceHash = await hashFiles(sourceFiles)
  logger.debug(`Hashed ${sourceFiles.length} source files for plugin at ${pluginPath}`)

  // Try to hash the bundle if it exists
  let bundleHash: string | undefined
  try {
    const bundlePath = `${pluginPath}/bundle/index.js`
    const bundleFile = Bun.file(bundlePath)
    if (await bundleFile.exists()) {
      bundleHash = await hashFile(bundlePath)
      logger.debug(`Hashed bundle at ${bundlePath}`)
    }
  } catch {
    logger.debug(`No bundle found for plugin at ${pluginPath}`)
  }

  return { sourceHash, bundleHash }
}

/**
 * Verify a hash matches the expected value
 */
export function verifyHash(actual: string, expected: string): boolean {
  return actual.toLowerCase() === expected.toLowerCase()
}

/**
 * Generate a short hash (first 8 characters) for display purposes
 */
export function shortHash(hash: string): string {
  return hash.slice(0, 8)
}
