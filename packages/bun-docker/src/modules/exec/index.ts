import { BaseModule } from "../base"
import type {
  ExecCreateOptions,
  ExecCreateResponse,
  ExecInspectResponse,
  ExecStartOptions,
} from "./types"

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
  async create(containerId: string, options: ExecCreateOptions): Promise<ExecCreateResponse> {
    const path = `/containers/${containerId}/exec`
    const res = await this.request(path, "POST", options)
    return (await res.json()) as ExecCreateResponse
  }

  /**
   * Start an exec instance
   * @param execId - Exec instance ID
   * @param options - Start configuration
   * @returns Response object (for streaming)
   */
  async start(execId: string, options?: ExecStartOptions): Promise<Response> {
    const path = `/exec/${execId}/start`
    const res = await this.request(path, "POST", options)
    return res
  }

  /**
   * Inspect an exec instance
   * @param execId - Exec instance ID
   * @returns Detailed exec instance information
   */
  async inspect(execId: string): Promise<ExecInspectResponse> {
    const path = `/exec/${execId}/json`
    const res = await this.request(path, "GET")
    return (await res.json()) as ExecInspectResponse
  }

  /**
   * Resize an exec instance TTY session
   * @param execId - Exec instance ID
   * @param height - Height of TTY session in characters
   * @param width - Width of TTY session in characters
   */
  async resize(execId: string, height: number, width: number): Promise<void> {
    await this.request(`/exec/${execId}/resize`, "POST", undefined, undefined, { h: height, w: width })
  }
}
