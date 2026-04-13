import { describe, expect, it } from "bun:test"
import type { ConnectionConfig } from "../modules/base/types"
import { prepareRequestOptions } from "../utils/request-options"

describe("prepareRequestOptions", () => {
  it("should set unix socket path for unix mode", () => {
    const config: ConnectionConfig = { mode: "unix", socketPath: "/var/run/docker.sock" }
    const options = prepareRequestOptions(
      config,
      "GET",
      undefined,
      undefined,
      "http://localhost/1.54/containers/json"
    )

    expect(options.unix).toBe("/var/run/docker.sock")
  })

  it("should set correct Host header for TCP mode", () => {
    const config: ConnectionConfig = { baseUrl: "http://192.168.1.1:2375", mode: "tcp" }
    const options = prepareRequestOptions(
      config,
      "GET",
      undefined,
      undefined,
      "http://192.168.1.1:2375/1.54/containers/json"
    )

    const headers = options.headers as Record<string, string>
    // @ts-expect-error
    expect(headers.Host).toBe("192.168.1.1:2375")
  })

  it("should set Host to localhost for unix mode", () => {
    const config: ConnectionConfig = { mode: "unix", socketPath: "/var/run/docker.sock" }
    const options = prepareRequestOptions(
      config,
      "GET",
      undefined,
      undefined,
      "http://localhost/1.54/containers/json"
    )

    const headers = options.headers as Record<string, string>
    // @ts-expect-error
    expect(headers.Host).toBe("localhost")
  })

  it("should serialize JSON body", () => {
    const config: ConnectionConfig = { mode: "unix" }
    const body = { image: "nginx", name: "test" }
    const options = prepareRequestOptions(
      config,
      "POST",
      body,
      undefined,
      "http://localhost/1.54/containers/create"
    )

    expect(options.body).toBe(JSON.stringify(body))

    const headers = options.headers as Record<string, string>
    expect(headers["Content-Type"]).toBe("application/json")
  })

  it("should pass through string body without Content-Type", () => {
    const config: ConnectionConfig = { mode: "unix" }
    const body = "raw string body"
    const options = prepareRequestOptions(
      config,
      "POST",
      body,
      undefined,
      "http://localhost/1.54/test"
    )

    expect(options.body).toBe("raw string body")

    const headers = options.headers as Record<string, string>
    expect(headers["Content-Type"]).toBeUndefined()
  })

  it("should not set Content-Type for FormData", () => {
    const config: ConnectionConfig = { mode: "unix" }
    const body = new FormData()
    const options = prepareRequestOptions(
      config,
      "POST",
      body,
      undefined,
      "http://localhost/1.54/test"
    )

    const headers = options.headers as Record<string, string>
    expect(headers["Content-Type"]).toBeUndefined()
  })

  it("should merge Headers instance", () => {
    const config: ConnectionConfig = { mode: "unix" }
    const customHeaders = new Headers()
    customHeaders.set("X-Custom", "value")
    customHeaders.set("X-Another", "another-value")

    const options = prepareRequestOptions(
      config,
      "GET",
      undefined,
      customHeaders,
      "http://localhost/1.54/test"
    )

    const headers = options.headers as Record<string, string>

    console.log(headers)

    expect(headers["x-custom"]).toBe("value")
    expect(headers["x-another"]).toBe("another-value")
  })

  it("should merge array headers", () => {
    const config: ConnectionConfig = { mode: "unix" }
    const customHeaders: [string, string][] = [
      ["X-First", "first-value"],
      ["X-Second", "second-value"],
    ]

    const options = prepareRequestOptions(
      config,
      "GET",
      undefined,
      customHeaders,
      "http://localhost/1.54/test"
    )

    const headers = options.headers as Record<string, string>
    expect(headers["X-First"]).toBe("first-value")
    expect(headers["X-Second"]).toBe("second-value")
  })

  it("should merge object headers", () => {
    const config: ConnectionConfig = { mode: "unix" }
    const customHeaders = { "X-Custom": "value", "X-Number": "42" }

    const options = prepareRequestOptions(
      config,
      "GET",
      undefined,
      customHeaders,
      "http://localhost/1.54/test"
    )

    const headers = options.headers as Record<string, string>
    expect(headers["X-Custom"]).toBe("value")
    expect(headers["X-Number"]).toBe("42")
  })

  it("should pass through TLS options", () => {
    const tlsConfig = {
      cert: Bun.file("/path/to/cert.pem"),
      key: Bun.file("/path/to/key.pem"),
    }
    const config: ConnectionConfig = {
      baseUrl: "https://docker.example.com:2376",
      mode: "tcp",
      tls: tlsConfig,
    }
    const options = prepareRequestOptions(
      config,
      "GET",
      undefined,
      undefined,
      "https://docker.example.com:2376/1.54/test"
    )

    expect(options.tls).toBe(tlsConfig)
  })

  it("should set the HTTP method", () => {
    const config: ConnectionConfig = { mode: "unix" }

    const getOptions = prepareRequestOptions(
      config,
      "GET",
      undefined,
      undefined,
      "http://localhost/test"
    )
    expect(getOptions.method).toBe("GET")

    const postOptions = prepareRequestOptions(
      config,
      "POST",
      undefined,
      undefined,
      "http://localhost/test"
    )
    expect(postOptions.method).toBe("POST")

    const deleteOptions = prepareRequestOptions(
      config,
      "DELETE",
      undefined,
      undefined,
      "http://localhost/test"
    )
    expect(deleteOptions.method).toBe("DELETE")

    const putOptions = prepareRequestOptions(
      config,
      "PUT",
      undefined,
      undefined,
      "http://localhost/test"
    )
    expect(putOptions.method).toBe("PUT")

    const headOptions = prepareRequestOptions(
      config,
      "HEAD",
      undefined,
      undefined,
      "http://localhost/test"
    )
    expect(headOptions.method).toBe("HEAD")
  })

  it("should handle URL with port in Host header", () => {
    const config: ConnectionConfig = { baseUrl: "http://192.168.1.1:2375", mode: "tcp" }
    const options = prepareRequestOptions(
      config,
      "GET",
      undefined,
      undefined,
      "http://192.168.1.1:2375/1.54/test"
    )

    const headers = options.headers as Record<string, string>
    // @ts-expect-error
    expect(headers.Host).toBe("192.168.1.1:2375")
  })
})
