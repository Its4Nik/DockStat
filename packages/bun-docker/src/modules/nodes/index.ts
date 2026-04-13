import { BaseModule } from "../base"
import type { DeleteNodeRoute, ListNodesRoute, NodeInspectRoute, UpdateNodeRoute } from "./types"

/**
 * Node module for Docker API
 */
export class NodesModule extends BaseModule {
  /**
   * List nodes
   * @param options Filters to process on the nodes list, encoded as JSON (a Record<string, string[]>).
   * @returns NodeListResponse
   */
  async list(options?: ListNodesRoute["parameters"]["query"]) {
    const res = await this.request(`/nodes`, "GET", undefined, undefined, options)
    return (await res.json()) as ListNodesRoute["responses"]["200"]["content"]["application/json"]
  }

  /**
   * Inspect a node
   * @param id The ID or name of the node
   */
  async inspect(id: string) {
    const res = await this.request(`/nodes/${id}`, "GET")
    return (await res.json()) as NodeInspectRoute["responses"]["200"]["content"]["application/json"]
  }

  /**
   *
   * @param id The ID or name of the node
   * @param force Force remove a node from the swarm (Default: false)
   * @returns `true` or throws an DockerError
   */
  async delete(id: string, options?: DeleteNodeRoute["parameters"]["query"]) {
    await this.request(`/nodes/${id}`, "DELETE", undefined, undefined, options)
    // No thrown error = success
    return true
  }

  /**
   *
   * @param id The ID or name of the node
   * @param version The version number of the node object being updated. This is required to avoid conflicting writes.
   * @param options What to update
   * @returns
   */
  async update(
    id: string,
    update: NonNullable<UpdateNodeRoute["requestBody"]>["content"]["application/json"],
    options: UpdateNodeRoute["parameters"]["query"]
  ): Promise<boolean> {
    await this.request(`/nodes/${id}/update`, "POST", update, undefined, options)
    // No thrown error = success
    return true
  }
}
