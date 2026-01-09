import chalk from "chalk"
import { callerMatchesDepth, LOG_LEVEL } from "./config"
import type { LogLevel } from "./types"

export const LEVEL_PRIORITY: Record<LogLevel, number> = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
}

export const levelColors: Record<LogLevel, (msg: string) => string> = {
  error: chalk.red.bold,
  warn: chalk.yellow.bold,
  info: chalk.green.bold,
  debug: chalk.blue.bold,
}

export function stringToHash(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  return hash
}

function hashToColor(hash: number): [number, number, number] {
  const h = Math.abs(hash) % 360
  const s = 70
  const l = 60
  return hslToRgb(h, s, l)
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const ps = s / 100
  const pl = l / 100
  const k = (n: number) => (n + h / 30) % 12
  const a = ps * Math.min(pl, 1 - pl)
  const f = (n: number) => pl - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))
  return [255 * f(0), 255 * f(8), 255 * f(4)]
}

export function getCallerInfo(): string {
  const stack = new Error().stack?.split("\n")
  if (stack) {
    for (let i = 4; i < stack.length; i++) {
      const stackVal = stack[i]
      if (stackVal) {
        const line = stackVal.trim()
        const matches = line.match(/\(?(.+):(\d+):(\d+)\)?$/)
        if (matches?.[1]) {
          return `${matches[1].split("/").pop()}:${matches[callerMatchesDepth]}`
        }
      }
    }
  }
  return ""
}

export const shouldLog = (level: LogLevel) => {
  return LEVEL_PRIORITY[level] <= LEVEL_PRIORITY[LOG_LEVEL]
}

export const shouldIgnore = (msg: string, ignoreList: string[]) => {
  const lower = msg.toLowerCase()
  return ignoreList.some((s) => lower.includes(s.toLowerCase()))
}

export function colorByReqID(rawReqId: string) {
  let reqId = rawReqId
  let from = ""

  if (reqId.includes("|")) {
    const parts = reqId.split("|")
    reqId = String(parts[0])
    from = String(parts[1])
  }

  const hash = stringToHash(reqId)
  const [r, g, b] = hashToColor(hash)

  return {
    id: chalk.rgb(Math.round(r), Math.round(g), Math.round(b))(reqId),
    from,
  }
}
