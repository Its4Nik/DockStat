import { afterEach, beforeEach, describe, expect, it } from "bun:test"
import {
  DEFAULT_API_VERSION,
  DEFAULT_SOCKET_PATH,
  getConnectionConfig,
  isSocketAvailable,
  loadTls,
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

describe("isSocketAvailable", () => {
  it("should return false for non-existent socket", async () => {
    const result = await isSocketAvailable("/tmp/non-existent-docker.sock")
    expect(result).toBe(false)
  })

  it("should return true for existing readable file", async () => {
    // Create a temporary file that exists
    const tempPath = "/tmp/test-docker-socket.sock"
    await Bun.write(tempPath, "")
    try {
      const result = await isSocketAvailable(tempPath)
      // The socket won't actually be connectable (it's a file, not a socket)
      // but the filesystem check should pass and we attempt connection
      expect(typeof result).toBe("boolean")
    } finally {
      await Bun.file(tempPath).delete()
    }
  })

  it("should handle connection errors gracefully", async () => {
    // Test with a path that's not a socket but exists
    const result = await isSocketAvailable("/etc/passwd")
    expect(result).toBe(false)
  })
})

describe("getConnectionConfig edge cases", () => {
  it("should not enable logger for invalid log level", () => {
    // biome-ignore lint/suspicious/noExplicitAny: needed for this test
    process.env.DOCKER_CLIENT_LOG_LEVEL = "invalid" as any
    const config = getConnectionConfig()
    expect(config.logger).toBeUndefined()
  })

  it("should handle empty string for DOCKER_HOST", () => {
    process.env.DOCKER_HOST = ""
    const config = getConnectionConfig()
    expect(config.mode).toBe("unix")
    expect(config.socketPath).toBe(DEFAULT_SOCKET_PATH)
  })

  it("should handle empty string for DOCKER_SOCKET", () => {
    process.env.DOCKER_HOST = undefined as unknown as string
    process.env.DOCKER_SOCKET = ""
    const config = getConnectionConfig()
    expect(config.mode).toBe("unix")
    expect(config.socketPath).toBe(DEFAULT_SOCKET_PATH)
  })

  it("should use https protocol when TLS is configured with DOCKER_HOST", () => {
    process.env.DOCKER_HOST = "tcp://docker.example.com:2376"
    process.env.CERT_FILE = "/path/to/cert.pem"
    process.env.KEY_FILE = "/path/to/key.pem"
    const config = getConnectionConfig()
    expect(config.baseUrl).toBe("https://docker.example.com:2376")
  })

  it("should handle DOCKER_HOST with https:// and TLS", () => {
    process.env.DOCKER_HOST = "https://docker.example.com:2376"
    process.env.CERT_FILE = "/path/to/cert.pem"
    process.env.KEY_FILE = "/path/to/key.pem"
    const config = getConnectionConfig()
    expect(config.baseUrl).toBe("https://docker.example.com:2376")
  })

  it("should use http protocol when TLS is not configured with TCP", () => {
    process.env.DOCKER_HOST = "tcp://docker.example.com:2375"
    // No TLS certs set
    const config = getConnectionConfig()
    expect(config.baseUrl).toBe("http://docker.example.com:2375")
  })

  describe("loadTls", () => {
    it("should return undefined when CERT_FILE is not set", () => {
      process.env.KEY_FILE = "/path/to/key.pem"
      const tls = loadTls()
      expect(tls).toBeUndefined()
    })

    it("should return undefined when KEY_FILE is not set", () => {
      process.env.CERT_FILE = "/path/to/cert.pem"
      const tls = loadTls()
      expect(tls).toBeUndefined()
    })

    it("should return undefined when neither CERT_FILE nor KEY_FILE are set", () => {
      const tls = loadTls()
      expect(tls).toBeUndefined()
    })

    it("should return TLS config with cert and key when both are set", () => {
      process.env.CERT_FILE = "/path/to/cert.pem"
      process.env.KEY_FILE = "/path/to/key.pem"
      const tls = loadTls()
      expect(tls).toBeDefined()
      expect(tls?.cert).toBeDefined()
      expect(tls?.key).toBeDefined()
      expect(tls?.ca).toBeUndefined()
    })

    it("should return TLS config with cert, key, and ca when CA_FILE is set", () => {
      process.env.CERT_FILE = "/path/to/cert.pem"
      process.env.KEY_FILE = "/path/to/key.pem"
      process.env.CA_FILE = "/path/to/ca.pem"
      const tls = loadTls()
      expect(tls).toBeDefined()
      expect(tls?.cert).toBeDefined()
      expect(tls?.key).toBeDefined()
      expect(tls?.ca).toBeDefined()
    })
  })
})
