import { describe, expect, it } from "bun:test"
import type { LoggerConfig } from "../utils/logger"
import { DockerLogger, resolveLoggerConfig } from "../utils/logger"

describe("DockerLogger", () => {
  it("should be disabled by default", () => {
    const logger = new DockerLogger()
    expect(logger.enabled).toBe(false)
    expect(logger.level).toBe("info")
  })

  it("should be enabled when configured", () => {
    const logger = new DockerLogger({ enabled: true, level: "debug" })
    expect(logger.enabled).toBe(true)
    expect(logger.level).toBe("debug")
  })

  it("should not log when disabled", () => {
    const messages: string[] = []
    const logger = new DockerLogger({
      enabled: false,
      level: "debug",
      write: (msg) => messages.push(msg),
    })

    logger.debug("test debug")
    logger.info("test info")
    logger.warn("test warn")
    logger.error("test error")

    expect(messages).toHaveLength(0)
  })

  it("should log at correct level when enabled", () => {
    const messages: string[] = []
    const logger = new DockerLogger({
      enabled: true,
      level: "info",
      write: (msg) => messages.push(msg),
    })

    logger.info("test info")
    logger.warn("test warn")
    logger.error("test error")

    expect(messages).toHaveLength(3)
    expect(messages[0]!).toContain("[docker:INFO]")
    expect(messages[0]!).toContain("test info")
    expect(messages[1]!).toContain("[docker:WARN]")
    expect(messages[1]!).toContain("test warn")
    expect(messages[2]!).toContain("[docker:ERROR]")
    expect(messages[2]!).toContain("test error")
  })

  it("should filter debug messages when level is info", () => {
    const messages: string[] = []
    const logger = new DockerLogger({
      enabled: true,
      level: "info",
      write: (msg) => messages.push(msg),
    })

    logger.debug("should not appear")
    logger.info("should appear")

    expect(messages).toHaveLength(1)
    expect(messages[0]!).toContain("should appear")
  })

  it("should filter info messages when level is warn", () => {
    const messages: string[] = []
    const logger = new DockerLogger({
      enabled: true,
      level: "warn",
      write: (msg) => messages.push(msg),
    })

    logger.debug("no")
    logger.info("no")
    logger.warn("yes")
    logger.error("yes")

    expect(messages).toHaveLength(2)
  })

  it("should filter warn messages when level is error", () => {
    const messages: string[] = []
    const logger = new DockerLogger({
      enabled: true,
      level: "error",
      write: (msg) => messages.push(msg),
    })

    logger.debug("no")
    logger.info("no")
    logger.warn("no")
    logger.error("yes")

    expect(messages).toHaveLength(1)
    expect(messages[0]!).toContain("yes")
  })

  it("should include data in log messages", () => {
    const messages: string[] = []
    const logger = new DockerLogger({
      enabled: true,
      level: "info",
      write: (msg) => messages.push(msg),
    })

    logger.info("test message", { method: "GET", path: "/containers/json" })

    expect(messages).toHaveLength(1)
    expect(messages[0]!).toContain("test message")
    expect(messages[0]!).toContain('"method":"GET"')
    expect(messages[0]!).toContain('"/containers/json"')
  })

  it("should format log messages with timestamp", () => {
    const messages: string[] = []
    const logger = new DockerLogger({
      enabled: true,
      level: "info",
      write: (msg) => messages.push(msg),
    })

    logger.info("test")

    expect(messages[0]!).toMatch(/\[docker:INFO\] \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z test/)
  })

  it("should include debug level logs when level is debug", () => {
    const messages: string[] = []
    const logger = new DockerLogger({
      enabled: true,
      level: "debug",
      write: (msg) => messages.push(msg),
    })

    logger.debug("debug msg")
    logger.info("info msg")
    logger.warn("warn msg")
    logger.error("error msg")

    expect(messages).toHaveLength(4)
    expect(messages[0]!).toContain("[docker:DEBUG]")
    expect(messages[0]!).toContain("debug msg")
  })

  it("should create child logger with same config", () => {
    const messages: string[] = []
    const parent = new DockerLogger({
      enabled: true,
      level: "debug",
      write: (msg) => messages.push(msg),
    })

    const child = parent.child()
    expect(child.enabled).toBe(true)
    expect(child.level).toBe("debug")

    child.info("child message")
    expect(messages).toHaveLength(1)
    expect(messages[0]!).toContain("child message")
  })

  it("should create child logger with overrides", () => {
    const messages: string[] = []
    const parent = new DockerLogger({
      enabled: true,
      level: "info",
      write: (msg) => messages.push(msg),
    })

    const child = parent.child({ level: "debug" })
    expect(child.level).toBe("debug")
    expect(child.enabled).toBe(true)

    child.debug("child debug")
    expect(messages).toHaveLength(1)
  })

  it("should use custom write function", () => {
    const messages: string[] = []
    const logger = new DockerLogger({
      enabled: true,
      level: "info",
      write: (msg) => messages.push(msg),
    })

    logger.info("custom writer test")
    expect(messages).toHaveLength(1)
    expect(messages[0]!).toContain("custom writer test")
  })
})

describe("resolveLoggerConfig", () => {
  it("should return disabled config for undefined input", () => {
    const config = resolveLoggerConfig(undefined)
    expect(config.enabled).toBe(false)
    expect(config.level).toBe("info")
  })

  it("should return disabled config for false input", () => {
    const config = resolveLoggerConfig(false)
    expect(config.enabled).toBe(false)
  })

  it("should return enabled config with defaults for true input", () => {
    const config = resolveLoggerConfig(true)
    expect(config.enabled).toBe(true)
    expect(config.level).toBe("info")
  })

  it("should pass through config object", () => {
    const input: LoggerConfig = { enabled: true, level: "debug" }
    const config = resolveLoggerConfig(input)
    expect(config.enabled).toBe(true)
    expect(config.level).toBe("debug")
  })

  it("should default enabled to false for config object without enabled", () => {
    const config = resolveLoggerConfig({ level: "debug" })
    expect(config.enabled).toBe(false)
  })

  it("should default level to info for config object without level", () => {
    const config = resolveLoggerConfig({ enabled: true })
    expect(config.level).toBe("info")
  })
})
