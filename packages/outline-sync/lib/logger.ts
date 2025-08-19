export type LogLevel = "DEBUG" | "INFO" | "WARN" | "ERROR" | "NONE";

const LEVEL_ORDER: Record<LogLevel, number> = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  NONE: 4,
};

const ANSI = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  debug: "\x1b[36m", // cyan
  info: "\x1b[32m", // green
  warn: "\x1b[33m", // yellow
  error: "\x1b[31m", // red
  gray: "\x1b[90m",
};

export class Logger {
  private minLevel: LogLevel;
  private colors: boolean;
  private showTimestamp: boolean;
  private name?: string;

  /**
   * new Logger({ level: 'DEBUG', colors: true, timestamp: true, name: 'api' })
   */
  constructor(opts?: {
    level?: LogLevel;
    colors?: boolean; // allow forcing on/off
    timestamp?: boolean;
    name?: string; // optional logger name e.g. "api"
  }) {
    const {
      level = "INFO",
      colors = true,
      timestamp = true,
      name,
    } = opts ?? {};

    this.minLevel = level;
    this.showTimestamp = timestamp;
    this.name = name;

    // auto-detect if we should colorize: respect NO_COLOR and non-tty (CI)
    const envNoColor = typeof process !== "undefined" && !!process.env.NO_COLOR;
    const isTTY =
      typeof process !== "undefined" &&
      !!process.stdout &&
      !!process.stdout.isTTY;
    this.colors = colors && !envNoColor && isTTY;
  }

  private shouldLog(level: LogLevel) {
    return (
      LEVEL_ORDER[level] >= 0 &&
      LEVEL_ORDER[level] >= LEVEL_ORDER[this.minLevel] &&
      LEVEL_ORDER[this.minLevel] < LEVEL_ORDER.NONE
    );
  }

  private levelMeta(level: Exclude<LogLevel, "NONE">) {
    switch (level) {
      case "DEBUG":
        return { tag: "DEBUG", color: ANSI.debug, emoji: "🐛" };
      case "INFO":
        return { tag: "INFO", color: ANSI.info, emoji: "ℹ️" };
      case "WARN":
        return { tag: "WARN", color: ANSI.warn, emoji: "⚠️" };
      case "ERROR":
        return { tag: "ERROR", color: ANSI.error, emoji: "❌" };
    }
  }

  private timestamp() {
    if (!this.showTimestamp) return "";
    // ISO-like with ms, or leave short local time:
    return new Date().toISOString();
  }

  private padLevelTag(tag: string) {
    // keep width consistent
    return tag.padEnd(5, " ");
  }

  private colorize(text: string, colorCode?: string) {
    if (!this.colors || !colorCode) return text;
    return `${colorCode}${text}${ANSI.reset}`;
  }

  private format(level: Exclude<LogLevel, "NONE">, msg: string) {
    const meta = this.levelMeta(level);
    const when = this.timestamp();
    const namePart = this.name ? `[${this.name}] ` : "";
    const levelTag = `[ ${this.padLevelTag(meta.tag)} ]`;
    const emoji = meta.emoji;
    if (this.colors) {
      // Color level tag and dim the timestamp + name
      const coloredTag = this.colorize(levelTag, meta.color);
      const dimMeta = this.colorize(when ? `${when} ` : "", ANSI.gray);
      const dimName = this.colorize(namePart, ANSI.dim);
      return `${dimMeta}${dimName}${coloredTag} ${emoji} ${msg}`;
    }
    return `${when ? `${when} ` : ""}${namePart}${levelTag} ${emoji} ${msg}`;
  }

  private write(level: Exclude<LogLevel, "NONE">, msg: string) {
    if (!this.shouldLog(level)) return;

    const out = this.format(level, msg);

    switch (level) {
      case "DEBUG":
        return console.debug ? console.debug(out) : console.log(out);
      case "INFO":
        return console.info ? console.info(out) : console.log(out);
      case "WARN":
        return console.warn ? console.warn(out) : console.log(out);
      case "ERROR":
        return console.error ? console.error(out) : console.log(out);
    }
  }

  debug(msg: string) {
    this.write("DEBUG", msg);
  }
  info(msg: string) {
    this.write("INFO", msg);
  }
  warn(msg: string) {
    this.write("WARN", msg);
  }
  error(msg: string) {
    this.write("ERROR", msg);
  }

  /** Return a child logger sharing options but with a name (useful for modules) */
  child(name: string) {
    return new Logger({
      level: this.minLevel,
      colors: this.colors,
      timestamp: this.showTimestamp,
      name,
    });
  }

  /** Update minimum level at runtime */
  setLevel(level: LogLevel) {
    this.minLevel = level;
  }
}
