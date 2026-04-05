import { BaseModule } from "../base"
import type { CreateExecRoute, InspectExecRoute, ResizeExecRoute, StartExecRoute } from "./types"

/**
 * Exec Module - handles all Docker exec operations
 */
export class ExecModule extends BaseModule {
  /**
   * Create an exec instance
   * @param containerId - Container ID or name
   * @param options - Exec configuration
   * @returns Exec create response with ID
   */
  async create(
    containerId: string,
    options: CreateExecRoute["requestBody"]["content"]["application/json"]
  ) {
    const path = `/containers/${containerId}/exec`
    const res = await this.request(path, "POST", options)
    return (await res.json()) as CreateExecRoute["responses"]["201"]["content"]["application/json"]
  }

  /**
   * Start an exec instance
   * @param execId - Exec instance ID
   * @param options - Start configuration
   * @returns Response object (for streaming)
   */
  async start(
    execId: string,
    options?: NonNullable<StartExecRoute["requestBody"]>["content"]["application/json"]
  ): Promise<Response> {
    const path = `/exec/${execId}/start`
    const res = await this.request(path, "POST", options)
    return res
  }

  /**
   * Inspect an exec instance
   * @param execId - Exec instance ID
   * @returns Detailed exec instance information
   */
  async inspect(execId: string) {
    const path = `/exec/${execId}/json`
    const res = await this.request(path, "GET")
    return (await res.json()) as InspectExecRoute["responses"]["200"]["content"]["application/json"]
  }

  /**
   * Resize an exec instance TTY session
   * @param execId - Exec instance ID
   * @param height - Height of TTY session in characters
   * @param width - Width of TTY session in characters
   */
  async resize(execId: string, options: ResizeExecRoute["parameters"]["query"]) {
    await this.request(`/exec/${execId}/resize`, "POST", undefined, undefined, options)
  }
}
