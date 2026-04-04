import { DockerError } from "./error"

export async function handleDockerResponse(
  response: Response,
  path: string,
  apiVersion: string,
  params: object | undefined
): Promise<Response> {
  if (!response.ok) {
    let text = await response.text()

    try {
      const parsed = JSON.parse(text)
      if (parsed.message) {
        text = parsed.message
      }
    } catch (_) {
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
