import chalk from "chalk";
import sourceMapSupport from "source-map-support";

sourceMapSupport.install();

let callerMatchesDepth = 2

if (Bun.env.DOCKSTAT_LOGGER_FULL_FILE_PATH === "true") {
  callerMatchesDepth = 1
}

function stringToHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return hash;
}

// Convert hash to a color (HSL → RGB)
function hashToColor(hash: number): [number, number, number] {
  const h = Math.abs(hash) % 360; // hue
  const s = 70; // saturation
  const l = 60; // lightness
  return hslToRgb(h, s, l);
}

// HSL → RGB conversion
function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const ps = s / 100;
  const pl = l / 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = ps * Math.min(pl, 1 - pl);
  const f = (n: number) =>
    pl - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [255 * f(0), 255 * f(8), 255 * f(4)];
}

function colorByReqID(reqId: string): string {
  const hash = stringToHash(reqId);
  const [r, g, b] = hashToColor(hash);
  return chalk.rgb(Math.round(r), Math.round(g), Math.round(b))(reqId);
}

// Helper to get file and line info from stack trace
function getCallerInfo(): string {
  const stack = new Error().stack?.split("\n");
  if (stack) {
    for (let i = 4; i < stack.length; i++) {
      const stackVal = stack[i];
      if (stackVal) {
        const line = stackVal.trim();
        const matches = line.match(/\(?(.+):(\d+):(\d+)\)?$/);
        if (matches) {
          if (matches[1]) {
            return `${matches[1].split("/").pop()}:${matches[callerMatchesDepth]}`;
          }
        }
      }
    }
  }
  return "";
}

type LogLevel = "error" | "warn" | "info" | "debug";

const levelColors: Record<LogLevel, (msg: string) => string> = {
  error: chalk.red.bold,
  warn: chalk.yellow.bold,
  info: chalk.green.bold,
  debug: chalk.blue.bold,
};

function formatMessage(
  level: LogLevel,
  prefix: string,
  message: string,
  parents: string[],
  requestID?: string
): string {
  const timestamp = chalk.magenta(new Date().toISOString().slice(11, 19)); // HH:mm:ss
  const coloredLevel = levelColors[level](level.toUpperCase());
  const callerInfo = chalk.blue(getCallerInfo());

  const coloredPrefix = parents.length >= 1 ? `[${chalk.cyan(prefix)}${chalk.yellow(
    `@${parents.join("@")}`
  )}` : `[${chalk.cyan(prefix)}`
  const msgPrefix = `${timestamp} ${requestID ? `(${colorByReqID(requestID)}) ` : ""}${coloredPrefix} ${callerInfo} ${coloredLevel}]`;
  return `${msgPrefix} : ${chalk.grey(message)}`;
}

class Logger {
  protected name: string;
  protected parents: string[];

  constructor(prefix: string, parents: string[] = []) {
    this.name = prefix;
    this.parents = parents;
  }

  error(msg: string, requestid?: string) {
    console.error(formatMessage("error", this.name, msg, this.parents, requestid));
  }

  warn(msg: string, requestid?: string) {
    console.warn(formatMessage("warn", this.name, msg, this.parents, requestid));
  }

  info(msg: string, requestid?: string) {
    console.info(formatMessage("info", this.name, msg, this.parents, requestid));
  }

  debug(msg: string, requestid?: string) {
    console.debug(formatMessage("debug", this.name, msg, this.parents, requestid));
  }

  getParents(): string[] {
    return this.parents;
  }

  getParentsForLoggerChaining(): string[] {
    return [this.name, ...this.parents]
  }

  addParent(prefix: string) {
    this.parents = [prefix, ...this.parents];
    return this.parents;
  }

  addParents(parents: string[]) {
    this.parents = parents
  }
}

export { Logger };
export default Logger;
