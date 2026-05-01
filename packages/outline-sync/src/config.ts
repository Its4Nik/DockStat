import fs from "node:fs"
import { readFile, writeFile } from "node:fs/promises"
import path, { join, resolve } from "node:path"
import YAML from "yaml"
import type { OutlineConfig } from "./types"
import { c, icon } from "./ui"

// ── Config file discovery ──────────────────────────────────────────────────

const CONFIG_FILENAMES = [
    "outline-sync.config.json",
    "outline-sync.config.yaml",
    "outline-sync.config.yml",
    "outline-sync.config.js",
    "outline-sync.config.cjs",
    "outline-sync.config",
    ".outlinerc",
    "package.json",
]

export async function findConfigPath(
    configPath?: string,
    startDir?: string,
): Promise<string | null> {
    const cwd = process.cwd()

    // 1) OUTLINE_CONFIG env override
    if (process.env.OUTLINE_CONFIG) {
        const candidate = path.isAbsolute(process.env.OUTLINE_CONFIG)
            ? process.env.OUTLINE_CONFIG
            : path.resolve(cwd, process.env.OUTLINE_CONFIG)
        try {
            await fs.promises.access(candidate, fs.constants.R_OK)
            return candidate
        } catch {
            // fallthrough
        }
    }

    // 2) Explicit CLI path
    if (configPath) {
        const resolved = path.isAbsolute(configPath)
            ? configPath
            : path.resolve(cwd, configPath)
        try {
            await fs.promises.access(resolved, fs.constants.R_OK)
            return resolved
        } catch {
            // fallthrough
        }
    }

    // 3) Walk up from startDir / cwd
    let dir = resolve(startDir || cwd)
    while (true) {
        for (const name of CONFIG_FILENAMES) {
            const candidate = join(dir, name)
            try {
                await fs.promises.access(candidate, fs.constants.R_OK)
                return candidate
            } catch {
                // not found
            }
        }
        const parent = path.dirname(dir)
        if (parent === dir) break
        dir = parent
    }

    return null
}

async function loadConfigFilePath(configPath?: string): Promise<Partial<OutlineConfig>> {
    if (!configPath) return {}
    const ext = path.extname(configPath).toLowerCase()
    const base = path.basename(configPath).toLowerCase()

    try {
        // JS/CJS config files
        if (ext === ".js" || ext === ".cjs") {
            try {
                delete require.cache[require.resolve(configPath)]
            } catch { /* noop */ }
            const mod = require(configPath)
            const cfg = mod.__esModule && mod.default ? mod.default : mod
            return (cfg as Partial<OutlineConfig>) || {}
        }

        const raw = await readFile(configPath, "utf-8")

        // package.json -> "outline" key
        if (base === "package.json") {
            const parsed = JSON.parse(raw)
            return (parsed.outline || parsed) as Partial<OutlineConfig>
        }

        // YAML config files
        if (ext === ".yaml" || ext === ".yml") {
            const parsed = YAML.parse(raw)
            return (parsed as Partial<OutlineConfig>) || {}
        }

        // JSON or extension-less files
        if (ext === ".json" || ext === ".config" || ext === ".outlinerc") {
            try {
                return JSON.parse(raw) as Partial<OutlineConfig>
            } catch {
                // fallthrough to YAML
            }
        }

        // Last resort: try JSON then YAML
        try {
            return JSON.parse(raw) as Partial<OutlineConfig>
        } catch {
            // try YAML
        }
        try {
            return YAML.parse(raw) as Partial<OutlineConfig>
        } catch {
            return {}
        }
    } catch {
        return {}
    }
}

export async function loadConfig(
    configPath?: string,
    startDir?: string,
): Promise<Partial<OutlineConfig>> {
    if (configPath) {
        const resolved = path.isAbsolute(configPath)
            ? configPath
            : path.resolve(process.cwd(), configPath)
        try {
            await fs.promises.access(resolved, fs.constants.R_OK)
            return loadConfigFilePath(resolved)
        } catch {
            // fallthrough
        }
    }
    const discovered = await findConfigPath(configPath, startDir)
    if (!discovered) return {}
    return loadConfigFilePath(discovered)
}

// ── Config resolution (merges CLI args, env, and file) ─────────────────────

function parseArrayOption(value: string): string[] {
    return value
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
}

export async function resolveConfig(
    options: {
        url?: string
        include?: string
        exclude?: string
        token?: string
        output?: string
        config?: string
        verbose?: boolean
        dryRun?: boolean
        createMissing?: boolean
        defaultCollection?: string
    },
): Promise<OutlineConfig> {
    const fileConfig = await loadConfig(options.config)

    const config: OutlineConfig = {
        createMissing: Boolean(options.createMissing || fileConfig.createMissing),
        customPaths: fileConfig.customPaths ?? {},
        defaultCollectionId: options.defaultCollection || fileConfig.defaultCollectionId,
        dryRun: Boolean(options.dryRun),
        excludeCollections: options.exclude
            ? parseArrayOption(options.exclude)
            : fileConfig.excludeCollections,
        force: false,
        includeCollections: options.include
            ? parseArrayOption(options.include)
            : fileConfig.includeCollections,
        outputDir:
            options.output || fileConfig.outputDir || process.env.OUTLINE_OUTPUT_DIR || "./outline-docs",
        token: options.token || fileConfig.token || process.env.OUTLINE_TOKEN || "",
        url: options.url || fileConfig.url || process.env.OUTLINE_URL || "",
        verbose: Boolean(options.verbose || fileConfig.verbose),
    }

    if (!config.url || !config.token) {
        console.error(
            `\n${c.red(`${icon.cross} Error: OUTLINE_URL and OUTLINE_TOKEN must be provided`)}\n`,
        )
        console.error("  Set via:")
        console.error(`    ${c.dim("\u2022")} Environment variables  ${c.dim("OUTLINE_URL, OUTLINE_TOKEN")}`)
        console.error(`    ${c.dim("\u2022")} CLI arguments          ${c.dim("--url, --token")}`)
        console.error(`    ${c.dim("\u2022")} Config file            ${c.dim("outline-sync.config.json")}`)
        console.error()
        process.exit(1)
    }

    return config
}

// ── Sample config generation ───────────────────────────────────────────────

export async function createSampleConfig(): Promise<void> {
    const configPath = join(process.cwd(), "outline-sync.config.json")

    if (fs.existsSync(configPath)) {
        console.error(`\n${c.red(`${icon.cross} outline-sync.config.json already exists`)}\n`)
        process.exit(1)
    }

    const sampleConfig = {
        createMissing: false,
        customPaths: {
            "doc-id-abc123": "../../README.md",
            "doc-id-xyz789": "custom/important-doc.md",
        },
        defaultCollectionId: "",
        excludeCollections: [],
        includeCollections: ["Engineering", "Product"],
        outputDir: "./outline-docs",
        token: "your_api_token",
        url: "https://your-outline.com",
    }

    await writeFile(configPath, JSON.stringify(sampleConfig, null, 2), "utf-8")
    console.log(`\n${c.green(`${icon.check} Created outline-sync.config.json`)}\n`)
}