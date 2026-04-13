import { describe, expect, it } from "bun:test"
import type { ConnectionConfig } from "../modules/base/types"
import { buildDockerUrl, buildQueryString } from "../utils/url"

describe("buildQueryString", () => {
  it("should return undefined for undefined params", () => {
    expect(buildQueryString(undefined)).toBeUndefined()
  })

  it("should return undefined for null params", () => {
    expect(buildQueryString(null as unknown as object)).toBeUndefined()
  })

  it("should build a query string with string values", () => {
    const result = buildQueryString({ name: "my-container" })
    expect(result).toBe("name=my-container")
  })

  it("should build a query string with number values", () => {
    const result = buildQueryString({ limit: 10, timeout: 5000 })
    expect(result).toBe("limit=10&timeout=5000")
  })

  it("should build a query string with boolean values", () => {
    const result = buildQueryString({ all: true, stream: false })
    expect(result).toBe("all=true&stream=false")
  })

  it("should build a query string with object values (JSON serialized)", () => {
    const filters = { status: ["running", "paused"] }
    const result = buildQueryString({ filters })
    expect(result).toBe("filters=%7B%22status%22%3A%5B%22running%22%2C%22paused%22%5D%7D")
  })

  it("should skip undefined values", () => {
    const result = buildQueryString({ baz: undefined as unknown as string, foo: "bar" })
    expect(result).toBe("foo=bar")
  })

  it("should return undefined for empty object", () => {
    const result = buildQueryString({})
    expect(result).toBe("")
  })

  it("should handle multiple params correctly", () => {
    const result = buildQueryString({ all: true, label: "app=web", limit: 10, quiet: false })
    expect(result).toContain("all=true")
    expect(result).toContain("limit=10")
    expect(result).toContain("quiet=false")
    expect(result).toContain("label=app%3Dweb")
  })
})

describe("buildDockerUrl", () => {
  it("should build URL for unix mode", () => {
    const config: ConnectionConfig = { mode: "unix", socketPath: "/var/run/docker.sock" }
    const result = buildDockerUrl(config, "/containers/json", undefined, "1.54")
    expect(result).toBe("http://localhost/1.54/containers/json")
  })

  it("should build URL for unix mode with query string", () => {
    const config: ConnectionConfig = { mode: "unix", socketPath: "/var/run/docker.sock" }
    const result = buildDockerUrl(config, "/containers/json", "all=true", "1.54")
    expect(result).toBe("http://localhost/1.54/containers/json?all=true")
  })

  it("should build URL for tcp mode without trailing slash", () => {
    const config: ConnectionConfig = { baseUrl: "http://192.168.1.1:2375", mode: "tcp" }
    const result = buildDockerUrl(config, "/images/json", undefined, "1.54")
    expect(result).toBe("http://192.168.1.1:2375/1.54/images/json")
  })

  it("should build URL for tcp mode with trailing slash", () => {
    const config: ConnectionConfig = { baseUrl: "http://192.168.1.1:2375/", mode: "tcp" }
    const result = buildDockerUrl(config, "/images/json", undefined, "1.54")
    expect(result).toBe("http://192.168.1.1:2375/1.54/images/json")
  })

  it("should build URL for tcp mode with query string", () => {
    const config: ConnectionConfig = { baseUrl: "http://192.168.1.1:2375", mode: "tcp" }
    const result = buildDockerUrl(config, "/containers/json", "all=true", "1.54")
    expect(result).toBe("http://192.168.1.1:2375/1.54/containers/json?all=true")
  })

  it("should build URL for npipe mode (same as unix)", () => {
    const config: ConnectionConfig = { mode: "npipe" }
    const result = buildDockerUrl(config, "/containers/json", undefined, "1.54")
    expect(result).toBe("http://localhost/1.54/containers/json")
  })

  it("should handle empty baseUrl for tcp mode gracefully", () => {
    const config: ConnectionConfig = { baseUrl: "", mode: "tcp" }
    const result = buildDockerUrl(config, "/containers/json", undefined, "1.54")
    expect(result).toBe("/1.54/containers/json")
  })
})
