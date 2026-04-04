import { BaseModule } from "../base"
import type { ListNodesOptions, NodeResponse, NodeUpdateOptions } from "./types"

export class NodesModule extends BaseModule {
  /**
   * List nodes
   * @param options Filters to process on the nodes list, encoded as JSON (a Record<string, string[]>).
   * @returns NodeResponse[]
   */
  async list(options?: ListNodesOptions) {
    const params = new URLSearchParams()
    params.append("filters", JSON.stringify(options))

    const path = `/nodes${options ? `${params}` : ""}`
    const res = await this.request(path, "GET")
    return (await res.json()) as NodeResponse[]
  }

  /**
   * Inspect a node
   * @param id The ID or name of the node
   */
  async inspect(id: string) {
    const path = `/nodes/${id}`
    const res = await this.request(path, "GET")
    return (await res.json()) as NodeResponse
  }

  /**
   *
   * @param id The ID or name of the node
   * @param force Force remove a node from the swarm (Default: false)
   * @returns `true` or throws an DockerError
   */
  async delete(id: string, force: boolean = false) {
    const params = new URLSearchParams()
    params.append("force", `${force}`)

    const query = params.toString()
    const path = `/nodes/${id}?${query}`

    await this.request(path, "DELETE")
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
    const params = new URLSearchParams()
    params.append("version", version.toString())

    const query = params.toString()
    const path = `/nodes/${id}/update?${query}`

    await this.request(path, "POST", options)
    // No thrown error = sucess
    return true
  }
}
