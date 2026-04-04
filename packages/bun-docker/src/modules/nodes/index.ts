import { BaseModule } from "../base"
import type { ListNodesOptions, NodeResponse, NodeUpdateOptions } from "./types"

export class NodesModule extends BaseModule {
  /**
   * List nodes
   * @param options Filters to process on the nodes list, encoded as JSON (a Record<string, string[]>).
   * @returns NodeResponse[]
   */
  async list(options?: ListNodesOptions) {
    const res = await this.request(`/nodes`, "GET", undefined, undefined, options)
    return (await res.json()) as NodeResponse[]
  }

  /**
   * Inspect a node
   * @param id The ID or name of the node
   */
  async inspect(id: string) {
    const res = await this.request(`/nodes/${id}`, "GET")
    return (await res.json()) as NodeResponse
  }

  /**
   *
   * @param id The ID or name of the node
   * @param force Force remove a node from the swarm (Default: false)
   * @returns `true` or throws an DockerError
   */
  async delete(id: string, force: boolean = false) {
    await this.request(`/nodes/${id}`, "DELETE", undefined, undefined, { force })
    // No thrown error = sucess
    return true
  }

  /**
   *
   * @param id The ID or name of the node
   * @param version The version number of the node object being updated. This is required to avoid conflicting writes.
   * @param options What to update
   * @returns
   */
  async update(id: string, version: number, options: NodeUpdateOptions) {
    await this.request(`/nodes/${id}/update`, "POST", options, undefined, { version })
    // No thrown error = sucess
    return true
  }
}
