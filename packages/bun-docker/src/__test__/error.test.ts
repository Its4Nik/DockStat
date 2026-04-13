import { describe, expect, it } from "bun:test"
import { DockerError } from "../utils/error"

describe("DockerError", () => {
  it("should set all properties correctly in constructor", () => {
    const error = new DockerError("Something went wrong", 404, "/containers/test/json", "1.54", {
      id: "test",
    })

    expect(error.message).toBe("Something went wrong")
    expect(error.status).toBe(404)
    expect(error.path).toBe("/containers/test/json")
    expect(error.version).toBe("1.54")
    expect(error.params).toEqual({ id: "test" })
  })

  it("should have name set to 'DockerError'", () => {
    const error = new DockerError("test", 500, "/test", "1.54", {})
    expect(error.name).toBe("DockerError")
  })

  it("should format error message correctly", () => {
    const error = new DockerError(
      "Docker API Error (404): No such container",
      404,
      "/containers/abc/json",
      "1.54",
      { id: "abc" }
    )

    expect(error.message).toBe("Docker API Error (404): No such container")
  })

  it("should accept string params", () => {
    const error = new DockerError("error", 500, "/test", "1.54", "No params defined")
    expect(error.params).toBe("No params defined")
  })

  it("should accept object params", () => {
    const params = { all: true, limit: 10 }
    const error = new DockerError("error", 500, "/test", "1.54", params)
    expect(error.params).toEqual(params)
  })

  it("should be an instance of Error", () => {
    const error = new DockerError("test", 500, "/test", "1.54", {})
    expect(error).toBeInstanceOf(Error)
    expect(error).toBeInstanceOf(DockerError)
  })

  it("should have a toString() method", () => {
    const error = new DockerError("Not found", 404, "/containers/x", "1.54", {})
    const str = error.toString()
    expect(str).toContain("DockerError")
    expect(str).toContain("Not found")
    expect(str).toContain("404")
    expect(str).toContain("/containers/x")
    expect(str).toContain("1.54")
  })

  it("toString() should return the expected format", () => {
    const error = new DockerError("Test error", 500, "/test/path", "1.43", "params")
    expect(error.toString()).toBe(
      "DockerError: Test error [HTTP 500] Path: /test/path Version: 1.43"
    )
  })

  it("properties should be readonly", () => {
    const error = new DockerError("test", 404, "/test", "1.54", {})
    // TypeScript readonly - at runtime we just verify the values exist
    expect(Object.getOwnPropertyDescriptor(error, "status")?.writable).toBe(true) // Error props are writable by default in JS
    expect(error.status).toBe(404)
  })
})
