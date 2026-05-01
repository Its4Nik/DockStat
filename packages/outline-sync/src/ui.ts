// ── ANSI color helpers ──────────────────────────────────────────────────────
// No external dependencies – pure ANSI escape sequences for maximum
// compatibility across terminals, CI runners, and pipe targets.

const isColorSupported = (): boolean => {
    if (process.env.NO_COLOR !== undefined) return false
    if (process.env.FORCE_COLOR !== undefined) return true
    return process.stdout.isTTY === true
}

const colorEnabled = isColorSupported()

function wrap(code: string, text: string): string {
    return colorEnabled ? `\x1b[${code}m${text}\x1b[0m` : text
}

export const c = {
    bold: (t: string) => wrap("1", t),
    dim: (t: string) => wrap("2", t),
    italic: (t: string) => wrap("3", t),
    underline: (t: string) => wrap("4", t),
    red: (t: string) => wrap("31", t),
    green: (t: string) => wrap("32", t),
    yellow: (t: string) => wrap("33", t),
    blue: (t: string) => wrap("34", t),
    magenta: (t: string) => wrap("35", t),
    cyan: (t: string) => wrap("36", t),
    white: (t: string) => wrap("37", t),
    bgRed: (t: string) => wrap("41", t),
    bgGreen: (t: string) => wrap("42", t),
    bgYellow: (t: string) => wrap("43", t),
    bgBlue: (t: string) => wrap("44", t),
}

// ── Icons ───────────────────────────────────────────────────────────────────

export const icon = {
    pull: "\u2B07",       // ⬇
    push: "\u2B06",       // ⬆
    sync: "\u{1F504}",    // 🔄
    check: "\u2713",      // ✓
    cross: "\u2717",      // ✗
    warn: "\u26A0",       // ⚠
    info: "\u2139",       // ℹ
    arrow: "\u2192",      // →
    bullet: "\u2022",     // •
    diamond: "\u25C6",    // ◆
    folder: "\u{1F4C1}",  // 📁
    file: "\u{1F4C4}",    // 📄
    clock: "\u23F0",      // ⏰
    rocket: "\u{1F680}",  // 🚀
    eyes: "\u{1F440}",    // 👀
    search: "\u{1F50D}",  // 🔍
    gear: "\u2699",       // ⚙
    star: "\u2605",       // ★
    question: "\u2753",   // ❓
} as const

// ── Status formatters ───────────────────────────────────────────────────────

import type { SyncStatus } from "./types"

const statusConfig: Record<SyncStatus, { label: string; color: (t: string) => string }> = {
    synced: { label: "Synced", color: c.green },
    pushed: { label: "Pushed", color: c.cyan },
    pulled: { label: "Pulled", color: c.blue },
    new: { label: "New", color: c.yellow },
    created: { label: "Created", color: c.green },
    conflict: { label: "Conflict", color: c.bgRed },
    error: { label: "Error", color: c.red },
    skipped: { label: "Skipped", color: c.dim },
    "not-found": { label: "Not Found", color: c.magenta },
}

export function formatStatus(status: SyncStatus): string {
    const cfg = statusConfig[status] ?? statusConfig.skipped
    return cfg.color(cfg.label)
}

// ── Table formatting ────────────────────────────────────────────────────────

interface Column {
    key: string
    header: string
    width: number
    align?: "left" | "right" | "center"
}

export function formatTable(rows: Array<Record<string, string>>, columns: Column[]): string {
    if (rows.length === 0) return ""

    // Build header
    const header = columns.map((col) => {
        const padded = col.align === "right"
            ? col.header.padStart(col.width)
            : col.align === "center"
                ? col.header.padStart(Math.floor((col.width + col.header.length) / 2)).padEnd(col.width)
                : col.header.padEnd(col.width)
        return c.bold(c.dim(padded))
    }).join("  ")

    // Build separator
    const separator = columns.map((col) => c.dim("\u2500".repeat(col.width))).join("  ")

    // Build rows
    const dataRows = rows.map((row) => {
        return columns.map((col) => {
            const value = row[col.key] ?? ""
            const truncated = value.length > col.width
                ? value.slice(0, col.width - 1) + "\u2026"
                : value
            if (col.align === "right") return truncated.padStart(col.width)
            if (col.align === "center") return truncated.padStart(Math.floor((col.width + truncated.length) / 2)).padEnd(col.width)
            return truncated.padEnd(col.width)
        }).join("  ")
    })

    return [header, separator, ...dataRows].join("\n")
}

// ── Spinner ─────────────────────────────────────────────────────────────────

const spinnerFrames = ["\u2819", "\u2839", "\u2838", "\u283C", "\u2834", "\u2826", "\u2827", "\u2807", "\u280F", "\u2819"]

export class Spinner {
    private frame = 0
    private interval: ReturnType<typeof setInterval> | null = null

    constructor(private message: string) { }

    start(): this {
        if (!process.stdout.isTTY) return this
        this.interval = setInterval(() => {
            process.stdout.write(`\r${c.cyan(spinnerFrames[this.frame])} ${this.message}`)
            this.frame = (this.frame + 1) % spinnerFrames.length
        }, 80)
        return this
    }

    update(message: string): this {
        this.message = message
        return this
    }

    stop(finalMessage?: string): this {
        if (this.interval) {
            clearInterval(this.interval)
            this.interval = null
            process.stdout.write("\r" + " ".repeat(this.message.length + 4) + "\r")
        }
        if (finalMessage) {
            process.stdout.write(finalMessage + "\n")
        }
        return this
    }
}

// ── Progress bar ────────────────────────────────────────────────────────────

export function progressBar(current: number, total: number, width = 20): string {
    const ratio = total > 0 ? current / total : 0
    const filled = Math.round(ratio * width)
    const empty = width - filled
    const bar = c.green("\u2588".repeat(filled)) + c.dim("\u2591".repeat(empty))
    return `[${bar}] ${current}/${total}`
}

// ── Utility ─────────────────────────────────────────────────────────────────

export function truncate(str: string, maxLength: number): string {
    if (str.length <= maxLength) return str
    return `${str.slice(0, maxLength - 1)}\u2026`
}

export function formatDate(date: Date): string {
    return date.toLocaleString("en-US", {
        day: "2-digit",
        hour: "2-digit",
        hour12: false,
        minute: "2-digit",
        month: "short",
        second: "2-digit",
        year: "numeric",
    })
}

export function formatDuration(ms: number): string {
    if (ms < 1000) return `${ms}ms`
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
    const mins = Math.floor(ms / 60000)
    const secs = Math.floor((ms % 60000) / 1000)
    return `${mins}m ${secs}s`
}

export function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes}B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
}