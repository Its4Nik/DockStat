import chalk from 'chalk'
import sourceMapSupport from 'source-map-support'

sourceMapSupport.install()

// Helper to get file and line info from stack trace
function getCallerInfo(): string {
  const stack = new Error().stack?.split('\n')
  if (stack) {
    for (let i = 4; i < stack.length; i++) {
      const stackVal = stack[i]
      if (stackVal) {
        const line = stackVal.trim()
        const matches = line.match(/\(?(.+):(\d+):(\d+)\)?$/)
        if (matches) {
          if (matches[1]) {
            return `${matches[1].split('/').pop()}:${matches[2]}`
          }
        }
      }
    }
  }
  return ''
}

type LogLevel = 'error' | 'warn' | 'info' | 'debug'

const levelColors: Record<LogLevel, (msg: string) => string> = {
  error: chalk.red.bold,
  warn: chalk.yellow.bold,
  info: chalk.green.bold,
  debug: chalk.blue.bold,
}

function formatMessage(
  level: LogLevel,
  prefix: string,
  message: string
): string {
  const timestamp = chalk.magenta(new Date().toISOString().slice(11, 19)) // HH:mm:ss
  const coloredLevel = levelColors[level](level.toUpperCase())
  const callerInfo = chalk.blue(getCallerInfo())
  const coloredPrefix = chalk.cyan(`[${prefix}]`)
  const msgPrefix = `${timestamp} ${coloredPrefix} ${callerInfo} ${coloredLevel}`
  return `${msgPrefix} : ${chalk.grey(message)}`
}

export function createLogger(prefix: string) {
  return {
    error: (msg: string) => console.error(formatMessage('error', prefix, msg)),
    warn: (msg: string) => console.warn(formatMessage('warn', prefix, msg)),
    info: (msg: string) => console.info(formatMessage('info', prefix, msg)),
    debug: (msg: string) => console.debug(formatMessage('debug', prefix, msg)),
  }
}
