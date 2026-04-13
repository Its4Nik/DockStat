import { describe, expect, it } from "bun:test"
import { DockerError } from "../utils/error"
import { handleDockerResponse } from "../utils/response"

function createMockResponse(status: number, body: string | null, ok?: boolean): Response {
  const isOk = ok !== undefined ? ok : status >= 200 && status < 300
  const response = {
    json: async () => (body ? JSON.parse(body) : null),
    ok: isOk,
    status,
    statusText: status === 404 ? "Not Found" : status === 500 ? "Internal Server Error" : "OK",
    text: async () => body,
  } as unknown as Response

  return response
}

describe("handleDockerResponse", () => {
  it("should return the response for OK status", async () => {
    const response = createMockResponse(200, '{"Id": "abc123"}')
    const result = await handleDockerResponse(response, "/containers/abc/json", "1.54", undefined)
    expect(result).toBe(response)
  })

  it("should return the response for 204 No Content", async () => {
    const response = createMockResponse(204, "")
    const result = await handleDockerResponse(response, "/containers/abc/start", "1.54", undefined)
    expect(result).toBe(response)
  })

  it("should throw DockerError for error response with JSON body containing message", async () => {
    const response = createMockResponse(404, '{"message": "No such container: abc"}')
    expect(
      await handleDockerResponse(response, "/containers/abc/json", "1.54", { id: "abc" })
    ).rejects.toThrow(DockerError)
  })

  it("should extract message from JSON body", async () => {
    const response = createMockResponse(404, '{"message": "No such container: abc"}')
    try {
      await handleDockerResponse(response, "/containers/abc/json", "1.54", undefined)
      expect.unreachable("Should have thrown")
    } catch (error) {
      expect(error).toBeInstanceOf(DockerError)
      const dockerError = error as DockerError
      expect(dockerError.message).toBe("Docker API Error (404): No such container: abc")
      expect(dockerError.status).toBe(404)
    }
  })

  it("should use raw text for error response with plain text body", async () => {
    const response = createMockResponse(500, "Internal Server Error")
    try {
      await handleDockerResponse(response, "/containers/abc/json", "1.54", undefined)
      expect.unreachable("Should have thrown")
    } catch (error) {
      expect(error).toBeInstanceOf(DockerError)
      const dockerError = error as DockerError
      expect(dockerError.message).toBe("Docker API Error (500): Internal Server Error")
    }
  })

  it("should handle 404 status correctly", async () => {
    const response = createMockResponse(404, '{"message": "not found"}')
    try {
      await handleDockerResponse(response, "/images/nginx/json", "1.54", undefined)
      expect.unreachable("Should have thrown")
    } catch (error) {
      expect(error).toBeInstanceOf(DockerError)
      expect((error as DockerError).status).toBe(404)
      expect((error as DockerError).path).toBe("/images/nginx/json")
      expect((error as DockerError).version).toBe("1.54")
    }
  })

  it("should handle 500 status correctly", async () => {
    const response = createMockResponse(500, '{"message": "server error"}')
    try {
      await handleDockerResponse(response, "/containers/create", "1.54", { name: "test" })
      expect.unreachable("Should have thrown")
    } catch (error) {
      expect(error).toBeInstanceOf(DockerError)
      expect((error as DockerError).status).toBe(500)
    }
  })

  it("should handle empty error body gracefully", async () => {
    const response = createMockResponse(404, "")
    try {
      await handleDockerResponse(response, "/containers/abc/json", "1.54", undefined)
      expect.unreachable("Should have thrown")
    } catch (error) {
      expect(error).toBeInstanceOf(DockerError)
      expect((error as DockerError).message).toContain("404")
    }
  })

  it("should pass params to DockerError", async () => {
    const params = { all: true }
    const response = createMockResponse(400, '{"message": "bad request"}')
    try {
      await handleDockerResponse(response, "/containers/json", "1.54", params)
      expect.unreachable("Should have thrown")
    } catch (error) {
      expect(error).toBeInstanceOf(DockerError)
      expect((error as DockerError).params).toEqual(params)
    }
  })

  it("should use fallback message for undefined params", async () => {
    const response = createMockResponse(400, '{"message": "bad request"}')
    try {
      await handleDockerResponse(response, "/containers/json", "1.54", undefined)
      expect.unreachable("Should have thrown")
    } catch (error) {
      expect(error).toBeInstanceOf(DockerError)
      expect((error as DockerError).params).toBe("No params defined")
    }
  })

  it("should handle JSON body without message field", async () => {
    const response = createMockResponse(400, '{"error": "something went wrong"}')
    try {
      await handleDockerResponse(response, "/test", "1.54", undefined)
      expect.unreachable("Should have thrown")
    } catch (error) {
      expect(error).toBeInstanceOf(DockerError)
      // Should use the raw text since there's no "message" field
      expect((error as DockerError).message).toContain("something went wrong")
    }
  })
})
