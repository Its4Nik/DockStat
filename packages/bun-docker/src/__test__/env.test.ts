import { afterEach, beforeEach, describe, expect, it } from "bun:test"
import {
  DEFAULT_API_VERSION,
  DEFAULT_SOCKET_PATH,
  DEFAULT_TIMEOUT,
  getConnectionConfig,
  parseDockerHost,
} from "../utils/env"
import type { LoggerConfig } from "../utils/logger"

function resetEnv() {
  // Clear Docker-related env vars
  for (const key of Object.keys(process.env)) {
    if (
      key.startsWith("DOCKER_") ||
      key === "CERT_FILE" ||
      key === "KEY_FILE" ||
      key === "CA_FILE"
    ) {
      delete process.env[key]
    }
  }
}

beforeEach(() => {
  resetEnv()
})

afterEach(() => {
  resetEnv()
})

describe("getConnectionConfig", () => {
  it("should return unix mode with default socket when no env vars are set", () => {
    const config = getConnectionConfig()
    expect(config.mode).toBe("unix")
    expect(config.socketPath).toBe(DEFAULT_SOCKET_PATH)
    expect(config.timeout).toBe(DEFAULT_TIMEOUT)
    expect(config.dockerAPIVersion).toBe(DEFAULT_API_VERSION)
  })

  it("should support DOCKER_SOCKET=unix:///var/run/docker.sock", () => {
    process.env.DOCKER_SOCKET = "unix:///var/run/docker.sock"
    const config = getConnectionConfig()
    expect(config.mode).toBe("unix")
    expect(config.socketPath).toBe("/var/run/docker.sock")
  })

  it("should support DOCKER_SOCKET=tcp://192.168.1.1:2375", () => {
    process.env.DOCKER_SOCKET = "tcp://192.168.1.1:2375"
    const config = getConnectionConfig()
    expect(config.mode).toBe("tcp")
    expect(config.baseUrl).toBe("http://192.168.1.1:2375")
  })

  it("should prefer DOCKER_HOST over DOCKER_SOCKET", () => {
    process.env.DOCKER_HOST = "tcp://10.0.0.1:2375"
    process.env.DOCKER_SOCKET = "unix:///var/run/docker.sock"
    const config = getConnectionConfig()
    expect(config.mode).toBe("tcp")
    expect(config.baseUrl).toBe("http://10.0.0.1:2375")
  })

  it("should support DOCKER_HOST=tcp://192.168.1.1:2375", () => {
    process.env.DOCKER_HOST = "tcp://192.168.1.1:2375"
    const config = getConnectionConfig()
    expect(config.mode).toBe("tcp")
    expect(config.baseUrl).toBe("http://192.168.1.1:2375")
  })

  it("should support DOCKER_HOST=unix:///var/run/docker.sock", () => {
    process.env.DOCKER_HOST = "unix:///var/run/docker.sock"
    const config = getConnectionConfig()
    expect(config.mode).toBe("unix")
    expect(config.socketPath).toBe("/var/run/docker.sock")
  })

  it("should support DOCKER_HOST=http://192.168.1.1:2375", () => {
    process.env.DOCKER_HOST = "http://192.168.1.1:2375"
    const config = getConnectionConfig()
    expect(config.mode).toBe("tcp")
    expect(config.baseUrl).toBe("http://192.168.1.1:2375")
  })

  it("should set timeout from DOCKER_TIMEOUT", () => {
    process.env.DOCKER_TIMEOUT = "60000"
    const config = getConnectionConfig()
    expect(config.timeout).toBe(60000)
  })

  it("should set API version from DOCKER_API_VERSION", () => {
    process.env.DOCKER_API_VERSION = "1.43"
    const config = getConnectionConfig()
    expect(config.dockerAPIVersion).toBe("1.43")
  })

  it("should enable logger from DOCKER_CLIENT_LOG_LEVEL", () => {
    process.env.DOCKER_CLIENT_LOG_LEVEL = "debug"
    const config = getConnectionConfig()
    expect(config.logger).toBeDefined()
    expect((config.logger as LoggerConfig)?.enabled).toBe(true)
    expect((config.logger as LoggerConfig)?.level).toBe("debug")
  })

  it("should enable TLS with CERT_FILE and KEY_FILE", () => {
    process.env.CERT_FILE = "/path/to/cert.pem"
    process.env.KEY_FILE = "/path/to/key.pem"
    const config = getConnectionConfig()
    expect(config.tls).toBeDefined()
    expect(config.tls?.cert).toBeDefined()
    expect(config.tls?.key).toBeDefined()
  })

  it("should include CA_FILE in TLS when set", () => {
    process.env.CERT_FILE = "/path/to/cert.pem"
    process.env.KEY_FILE = "/path/to/key.pem"
    process.env.CA_FILE = "/path/to/ca.pem"
    const config = getConnectionConfig()
    expect(config.tls?.ca).toBeDefined()
  })

  it("should use https when TLS is configured with TCP", () => {
    process.env.DOCKER_HOST = "tcp://192.168.1.1:2376"
    process.env.CERT_FILE = "/path/to/cert.pem"
    process.env.KEY_FILE = "/path/to/key.pem"
    const config = getConnectionConfig()
    expect(config.baseUrl).toBe("https://192.168.1.1:2376")
  })

  it("should not include TLS when CERT_FILE or KEY_FILE is missing", () => {
    process.env.CERT_FILE = "/path/to/cert.pem"
    // KEY_FILE not set
    const config = getConnectionConfig()
    expect(config.tls).toBeUndefined()
  })
})

describe("parseDockerHost", () => {
  it("should parse unix:// URL", () => {
    const result = parseDockerHost("unix:///var/run/docker.sock")
    expect(result.mode).toBe("unix")
    expect(result.socketPath).toBe("/var/run/docker.sock")
  })

  it("should parse tcp:// URL", () => {
    const result = parseDockerHost("tcp://192.168.1.1:2375")
    expect(result.mode).toBe("tcp")
    expect(result.baseUrl).toBe("192.168.1.1:2375")
  })

  it("should parse http:// URL", () => {
    const result = parseDockerHost("http://192.168.1.1:2375")
    expect(result.mode).toBe("tcp")
    expect(result.baseUrl).toBe("192.168.1.1:2375")
  })

  it("should parse https:// URL", () => {
    const result = parseDockerHost("https://docker.example.com:2376")
    expect(result.mode).toBe("tcp")
    expect(result.baseUrl).toBe("docker.example.com:2376")
  })

  it("should parse raw host:port as tcp", () => {
    const result = parseDockerHost("192.168.1.1:2375")
    expect(result.mode).toBe("tcp")
    expect(result.baseUrl).toBe("192.168.1.1:2375")
  })

  it("should parse raw path as unix socket", () => {
    const result = parseDockerHost("/var/run/docker.sock")
    expect(result.mode).toBe("unix")
    expect(result.socketPath).toBe("/var/run/docker.sock")
  })
})
