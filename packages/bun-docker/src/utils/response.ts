import { DockerError } from "./error"

/**
 * Handle and validate a Docker API response.
 *
 * If the response is OK (`response.ok === true`), it is returned as-is.
 * If the response indicates an error, the body is read and parsed to extract
 * the error message. The error message is extracted from the JSON `message` field
 * if present; otherwise, the raw text body is used.
 *
 * For empty error bodies (e.g., 204 responses that still have `ok: false` due to
 * network issues), a generic message is used.
 *
 * @param response - The raw `Response` object from the fetch call.
 * @param path - The API endpoint path that was requested (for error context).
 * @param apiVersion - The Docker API version used (for error context).
 * @param params - The original request parameters (for error context).
 * @returns The original `Response` object if the request was successful.
 * @throws {DockerError} If the response status indicates an error.
 */
export async function handleDockerResponse(
  response: Response,
  path: string,
  apiVersion: string,
  params: object | undefined
): Promise<Response> {
  if (!response.ok) {
    let text = ""

    try {
      text = await response.text()
    } catch {
      // Body may not be readable (e.g., body already consumed or network error)
      text = ""
    }

    // Handle empty body
    if (!text) {
      throw new DockerError(
        `Docker API Error (${response.status}): ${response.statusText || "Unknown error"}`,
        response.status,
        path,
        apiVersion,
        params || "No params defined"
      )
    }

    // Try to extract a structured message from JSON
    try {
      const parsed = JSON.parse(text)
      if (typeof parsed.message === "string") {
        text = parsed.message
      }
    } catch {
      // If JSON parsing fails, we stick with the raw text response
    }

    throw new DockerError(
      `Docker API Error (${response.status}): ${text}`,
      response.status,
      path,
      apiVersion,
      params || "No params defined"
    )
  }

  return response
}
