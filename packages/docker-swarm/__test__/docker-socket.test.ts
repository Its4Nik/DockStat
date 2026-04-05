import { describe, expect, test } from "bun:test"
import type { DockerConnectionOptions } from "../src/types"
import {
  buildApiUrl,
  buildConnectionConfig,
  compareVersions,
  DEFAULT_HOST,
  DEFAULT_SOCKET_PATH,
  DEFAULT_TIMEOUT,
  isSocketAvailable,
  parseDockerVersion,
} from "../src/utils/docker-socket"

/**
 * Comprehensive tests for Docker socket connection utilities including:
 * - Connection configuration building
 * - Socket availability checking
 * - API URL construction
 * - Docker version parsing
 * - Version comparison
 */

describe("Default constants", () => {
  test("DEFAULT_SOCKET_PATH is set correctly", () => {
    expect(DEFAULT_SOCKET_PATH).toBe("/var/run/docker.sock")
  })

  test("DEFAULT_HOST is set correctly", () => {
    expect(DEFAULT_HOST).toBe("http://localhost")
  })

  test("DEFAULT_TIMEOUT is set correctly", () => {
    expect(DEFAULT_TIMEOUT).toBe(30000)
  })
})

describe("Connection configuration building", () => {
  test("buildConnectionConfig returns default config with empty options", () => {
    const config = buildConnectionConfig()

    expect(config.socketPath).toBe(DEFAULT_SOCKET_PATH)
    expect(config.host).toBeUndefined()
    expect(config.timeout).toBe(DEFAULT_TIMEOUT)
  })

  test("buildConnectionConfig uses custom socket path", () => {
    const options: DockerConnectionOptions = {
      socketPath: "/custom/docker.sock",
    }
    const config = buildConnectionConfig(options)

    expect(config.socketPath).toBe("/custom/docker.sock")
    expect(config.host).toBeUndefined()
    expect(config.timeout).toBe(DEFAULT_TIMEOUT)
  })

  test("buildConnectionConfig uses custom host", () => {
    const options: DockerConnectionOptions = {
      host: "http://localhost:2375",
    }
    const config = buildConnectionConfig(options)

    expect(config.socketPath).toBeUndefined()
    expect(config.host).toBe("http://localhost:2375")
    expect(config.timeout).toBe(DEFAULT_TIMEOUT)
  })

  test("buildConnectionConfig uses custom timeout", () => {
    const options: DockerConnectionOptions = {
      timeout: 60000,
    }
    const config = buildConnectionConfig(options)

    expect(config.socketPath).toBe(DEFAULT_SOCKET_PATH)
    expect(config.host).toBeUndefined()
    expect(config.timeout).toBe(60000)
  })

  test("buildConnectionConfig prioritizes socket path over host", () => {
    const options: DockerConnectionOptions = {
      socketPath: "/custom/docker.sock",
      host: "http://localhost:2375",
    }
    const config = buildConnectionConfig(options)

    expect(config.socketPath).toBe("/custom/docker.sock")
    expect(config.host).toBeUndefined()
  })

  test("buildConnectionConfig handles all options", () => {
    const options: DockerConnectionOptions = {
      socketPath: "/custom/docker.sock",
      timeout: 45000,
    }
    const config = buildConnectionConfig(options)

    expect(config.socketPath).toBe("/custom/docker.sock")
    expect(config.timeout).toBe(45000)
  })

  test("buildConnectionConfig handles HTTPS host", () => {
    const options: DockerConnectionOptions = {
      host: "https://docker.example.com:2376",
    }
    const config = buildConnectionConfig(options)

    expect(config.socketPath).toBeUndefined()
    expect(config.host).toBe("https://docker.example.com:2376")
  })

  test("buildConnectionConfig handles host with IP address", () => {
    const options: DockerConnectionOptions = {
      host: "http://192.168.1.100:2375",
    }
    const config = buildConnectionConfig(options)

    expect(config.socketPath).toBeUndefined()
    expect(config.host).toBe("http://192.168.1.100:2375")
  })
})

describe("API URL building", () => {
  test("buildApiUrl uses default host when not provided", () => {
    const url = buildApiUrl("/containers/json")

    expect(url).toBe("http://localhost/containers/json")
  })

  test("buildApiUrl uses provided host", () => {
    const url = buildApiUrl("/containers/json", "http://localhost:2375")

    expect(url).toBe("http://localhost:2375/containers/json")
  })

  test("buildApiUrl handles path without leading slash", () => {
    const url = buildApiUrl("containers/json", "http://localhost:2375")

    expect(url).toBe("http://localhost:2375/containers/json")
  })

  test("buildApiUrl handles path with leading slash", () => {
    const url = buildApiUrl("/services/list", "http://docker.example.com:2375")

    expect(url).toBe("http://docker.example.com:2375/services/list")
  })

  test("buildApiUrl handles nested paths", () => {
    const url = buildApiUrl("/services/abc123/logs", "https://secure.docker.com:2376")

    expect(url).toBe("https://secure.docker.com:2376/services/abc123/logs")
  })

  test("buildApiUrl handles root path", () => {
    const url = buildApiUrl("/", "http://localhost:2375")

    expect(url).toBe("http://localhost:2375/")
  })

  test("buildApiUrl handles empty path", () => {
    const url = buildApiUrl("", "http://localhost:2375")

    expect(url).toBe("http://localhost:2375/")
  })
})

describe("Docker version parsing", () => {
  test("parseDockerVersion parses standard version", () => {
    const version = parseDockerVersion("24.0.7")

    expect(version).toEqual({
      major: 24,
      minor: 0,
      patch: 7,
      build: undefined,
    })
  })

  test("parseDockerVersion parses version with build suffix", () => {
    const version = parseDockerVersion("24.0.7-alpine")

    expect(version).toEqual({
      major: 24,
      minor: 0,
      patch: 7,
      build: "alpine",
    })
  })

  test("parseDockerVersion parses version with complex build", () => {
    const version = parseDockerVersion("23.0.6-ce")

    expect(version).toEqual({
      major: 23,
      minor: 0,
      patch: 6,
      build: "ce",
    })
  })

  test("parseDockerVersion parses version with numeric build", () => {
    const version = parseDockerVersion("20.10.24-12345")

    expect(version).toEqual({
      major: 20,
      minor: 10,
      patch: 24,
      build: "12345",
    })
  })

  test("parseDockerVersion handles major.minor.patch format", () => {
    const version = parseDockerVersion("1.2.3")

    expect(version).toEqual({
      major: 1,
      minor: 2,
      patch: 3,
      build: undefined,
    })
  })

  test("parseDockerVersion returns null for invalid format", () => {
    const version = parseDockerVersion("invalid")

    expect(version).toBeNull()
  })

  test("parseDockerVersion returns null for missing patch", () => {
    const version = parseDockerVersion("24.0")

    expect(version).toBeNull()
  })

  test("parseDockerVersion returns null for missing minor", () => {
    const version = parseDockerVersion("24")

    expect(version).toBeNull()
  })

  test("parseDockerVersion returns null for empty string", () => {
    const version = parseDockerVersion("")

    expect(version).toBeNull()
  })

  test("parseDockerVersion returns null for non-numeric version", () => {
    const version = parseDockerVersion("a.b.c")

    expect(version).toBeNull()
  })

  test("parseDockerVersion handles versions with letters in build", () => {
    const version = parseDockerVersion("24.0.7-rc1")

    expect(version).toEqual({
      major: 24,
      minor: 0,
      patch: 7,
      build: "rc1",
    })
  })
})

describe("Version comparison", () => {
  test("compareVersions returns 0 for equal versions", () => {
    const result = compareVersions("24.0.7", "24.0.7")

    expect(result).toBe(0)
  })

  test("compareVersions returns 1 when first version is greater (major)", () => {
    const result = compareVersions("24.0.7", "23.0.7")

    expect(result).toBe(1)
  })

  test("compareVersions returns -1 when first version is smaller (major)", () => {
    const result = compareVersions("23.0.7", "24.0.7")

    expect(result).toBe(-1)
  })

  test("compareVersions returns 1 when first version is greater (minor)", () => {
    const result = compareVersions("24.1.0", "24.0.7")

    expect(result).toBe(1)
  })

  test("compareVersions returns -1 when first version is smaller (minor)", () => {
    const result = compareVersions("24.0.7", "24.1.0")

    expect(result).toBe(-1)
  })

  test("compareVersions returns 1 when first version is greater (patch)", () => {
    const result = compareVersions("24.0.8", "24.0.7")

    expect(result).toBe(1)
  })

  test("compareVersions returns -1 when first version is smaller (patch)", () => {
    const result = compareVersions("24.0.7", "24.0.8")

    expect(result).toBe(-1)
  })

  test("compareVersions ignores build suffix", () => {
    const result = compareVersions("24.0.7-alpine", "24.0.7-ce")

    expect(result).toBe(0)
  })

  test("compareVersions handles versions with and without build", () => {
    const result = compareVersions("24.0.7", "24.0.7-alpine")

    expect(result).toBe(0)
  })

  test("compareVersions returns 0 for invalid versions", () => {
    const result = compareVersions("invalid", "also-invalid")

    expect(result).toBe(0)
  })

  test("compareVersions handles zero versions", () => {
    const result = compareVersions("0.0.0", "0.0.0")

    expect(result).toBe(0)
  })

  test("compareVersions handles large version numbers", () => {
    const result = compareVersions("99.99.99", "1.1.1")

    expect(result).toBe(1)
  })

  test("compareVersions correctly orders patch versions", () => {
    expect(compareVersions("24.0.1", "24.0.2")).toBe(-1)
    expect(compareVersions("24.0.2", "24.0.3")).toBe(-1)
    expect(compareVersions("24.0.3", "24.0.2")).toBe(1)
  })

  test("compareVersions correctly orders minor versions", () => {
    expect(compareVersions("24.1.0", "24.2.0")).toBe(-1)
    expect(compareVersions("24.2.0", "24.3.0")).toBe(-1)
    expect(compareVersions("24.3.0", "24.2.0")).toBe(1)
  })
})

describe("Socket availability checking", () => {
  test("isSocketAvailable returns boolean", async () => {
    const available = await isSocketAvailable()

    expect(typeof available).toBe("boolean")
  })

  test("isSocketAvailable checks default socket path", async () => {
    const available = await isSocketAvailable(DEFAULT_SOCKET_PATH)

    expect(typeof available).toBe("boolean")
  })

  test("isSocketAvailable returns false for nonexistent socket", async () => {
    const available = await isSocketAvailable("/nonexistent/docker.sock")

    expect(available).toBe(false)
  })

  test("isSocketAvailable returns false for invalid path", async () => {
    const available = await isSocketAvailable("/tmp/invalid/path/docker.sock")

    expect(available).toBe(false)
  })

  test("isSocketAvailable uses custom socket path", async () => {
    // This test may fail if the custom socket doesn't exist, which is expected
    const available = await isSocketAvailable("/custom/docker.sock")

    expect(typeof available).toBe("boolean")
  })
})

describe("Connection configuration edge cases", () => {
  test("buildConnectionConfig handles undefined options", () => {
    const config = buildConnectionConfig(undefined)

    expect(config).toBeDefined()
    expect(config.socketPath).toBe(DEFAULT_SOCKET_PATH)
    expect(config.timeout).toBe(DEFAULT_TIMEOUT)
  })

  test("buildConnectionConfig handles null options", () => {
    // buildConnectionConfig doesn't handle null, it throws TypeError
    expect(() => {
      buildConnectionConfig(null as unknown as DockerConnectionOptions)
    }).toThrow(TypeError)
  })

  test("buildConnectionConfig handles zero timeout", () => {
    const options: DockerConnectionOptions = {
      timeout: 0,
    }
    const config = buildConnectionConfig(options)

    expect(config.timeout).toBe(0)
  })

  test("buildConnectionConfig handles very large timeout", () => {
    const options: DockerConnectionOptions = {
      timeout: Number.MAX_SAFE_INTEGER,
    }
    const config = buildConnectionConfig(options)

    expect(config.timeout).toBe(Number.MAX_SAFE_INTEGER)
  })

  test("buildConnectionConfig handles negative timeout", () => {
    const options: DockerConnectionOptions = {
      timeout: -1000,
    }
    const config = buildConnectionConfig(options)

    expect(config.timeout).toBe(-1000)
  })
})

describe("API URL building edge cases", () => {
  test("buildApiUrl handles path with query parameters", () => {
    const url = buildApiUrl("/containers/json?all=1", "http://localhost:2375")

    expect(url).toBe("http://localhost:2375/containers/json?all=1")
  })

  test("buildApiUrl handles path with multiple slashes", () => {
    const url = buildApiUrl("//containers//json", "http://localhost:2375")

    expect(url).toBe("http://localhost:2375//containers//json")
  })

  test("buildApiUrl handles host with trailing slash", () => {
    const url = buildApiUrl("/containers/json", "http://localhost:2375/")

    expect(url).toBe("http://localhost:2375//containers/json")
  })

  test("buildApiUrl handles IPv6 address", () => {
    const url = buildApiUrl("/containers/json", "http://[::1]:2375")

    expect(url).toBe("http://[::1]:2375/containers/json")
  })
})

describe("Version parsing edge cases", () => {
  test("parseDockerVersion handles single digit versions", () => {
    const version = parseDockerVersion("1.0.0")

    expect(version).toEqual({
      major: 1,
      minor: 0,
      patch: 0,
      build: undefined,
    })
  })

  test("parseDockerVersion handles very large version numbers", () => {
    const version = parseDockerVersion("999.999.999")

    expect(version).toEqual({
      major: 999,
      minor: 999,
      patch: 999,
      build: undefined,
    })
  })

  test("parseDockerVersion handles version with hyphen-separated build", () => {
    const version = parseDockerVersion("24.0.7-ubuntu-22.04")

    expect(version).toEqual({
      major: 24,
      minor: 0,
      patch: 7,
      build: "ubuntu-22.04",
    })
  })

  test("parseDockerVersion handles version with dot-separated build", () => {
    const version = parseDockerVersion("24.0.7.12345")

    expect(version).toBeNull()
  })

  test("parseDockerVersion handles version with multiple hyphens", () => {
    const version = parseDockerVersion("24.0.7-rc1-beta")

    expect(version).toEqual({
      major: 24,
      minor: 0,
      patch: 7,
      build: "rc1-beta",
    })
  })
})
