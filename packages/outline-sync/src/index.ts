import fs from 'fs';
import path from 'path';

const fsp = fs.promises;

const CONFIG_FILENAMES = [
  'outline.config.js',
  'outline.config.cjs',
  'outline.config.json',
  'outline.config',
  '.outlinerc',
  'outline.config.yaml',
  'outline.config.yml',
  'package.json'
];

/**
 * Search for a configuration file.
 * - If process.env.OUTLINE_CONFIG is set, that path is used (resolved relative to cwd if not absolute).
 * - Otherwise, walk up parent directories from startDir looking for any of CONFIG_FILENAMES.
 * Returns the resolved path or null if not found.
 */
export async function findConfig(startDir?: string): Promise<string | null> {
  const cwd = process.cwd();

  // Respect explicit environment override first
  const envPath = process.env.OUTLINE_CONFIG;
  if (envPath) {
    const resolved = path.isAbsolute(envPath) ? envPath : path.resolve(cwd, envPath);
    try {
      await fsp.access(resolved, fs.constants.R_OK);
      return resolved;
    } catch (err) {
      // If the env-provided path doesn't exist, we continue to search as a fallback
      // but also surface a helpful error downstream if needed.
    }
  }

  // Start searching from provided startDir or cwd and walk up to the filesystem root
  let dir = path.resolve(startDir || cwd);
  while (true) {
    for (const name of CONFIG_FILENAMES) {
      const candidate = path.join(dir, name);
      try {
        await fsp.access(candidate, fs.constants.R_OK);
        return candidate;
      } catch (_) {
        // not found, continue
      }
    }

    const parent = path.dirname(dir);
    if (parent === dir) break; // reached root
    dir = parent;
  }

  return null;
}

/**
 * Load configuration discovered by findConfig.
 * - JS/CJS files are required() so they can export functions/objects.
 * - JSON and package.json are parsed as JSON. If package.json contains an `outline` key, that is returned.
 * - Other files are attempted to be JSON-parsed as a fallback; if parsing fails the raw text is returned.
 */
export async function loadConfig(startDir?: string): Promise<any> {
  const configPath = await findConfig(startDir);
  if (!configPath) return null;

  const ext = path.extname(configPath).toLowerCase();
  const base = path.basename(configPath).toLowerCase();

  try {
    if (ext === '.js' || ext === '.cjs') {
      // Use require so JavaScript config files can export functions/objects.
      // Delete from cache to pick up changes when repeatedly run in a long-lived process.
      try {
        delete require.cache[require.resolve(configPath)];
      } catch (_) {}
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const mod = require(configPath);
      return mod && mod.__esModule && mod.default ? mod.default : mod;
    }

    const raw = await fsp.readFile(configPath, 'utf8');

    if (ext === '.json' || base === 'package.json') {
      const parsed = JSON.parse(raw);
      if (base === 'package.json') return parsed.outline || parsed;
      return parsed;
    }

    // Fallback: try JSON parse, otherwise return raw text
    try {
      return JSON.parse(raw);
    } catch (_) {
      return raw;
    }
  } catch (err) {
    // Re-throw with some context
    throw new Error(`Failed to load config at ${configPath}: ${err instanceof Error ? err.message : String(err)}`);
  }
}

export default loadConfig;
