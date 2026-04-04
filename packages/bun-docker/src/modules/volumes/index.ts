import { BaseModule } from "../base"
import type {
  ListVolumesOptions,
  PruneVolumesOptions,
  Volume,
  VolumeCreateRequest,
  VolumeListResponse,
  VolumePruneResponse,
  VolumeUpdateRequest,
} from "./types"

/**
 * Volume module for Docker API
 */
export class VolumeModule extends BaseModule {
  /**
   * List volumes
   */
  async list(options?: ListVolumesOptions): Promise<VolumeListResponse> {
    const params = options?.filters || {}
    const query = new URLSearchParams()

    if (Object.keys(params).length > 0) {
      query.set("filters", JSON.stringify(params))
    }

    const path = `/volumes${query.toString() ? `?${query.toString()}` : ""}`
    const res = await this.request(path)
    return (await res.json()) as VolumeListResponse
  }

  /**
   * Create a volume
   */
  async create(config: VolumeCreateRequest): Promise<Volume> {
    const res = await this.request("/volumes/create", "POST", config)
    return (await res.json()) as Volume
  }

  /**
   * Inspect a volume
   */
  async inspect(name: string): Promise<Volume> {
    const res = await this.request(`/volumes/${encodeURIComponent(name)}`)
    return (await res.json()) as Volume
  }

  /**
   * Update a volume (for cluster volumes only)
   */
  async update(name: string, body: VolumeUpdateRequest, version: number): Promise<void> {
    const query = new URLSearchParams()
    query.set("version", version.toString())
    const path = `/volumes/${encodeURIComponent(name)}?${query.toString()}`
    await this.request(path, "PUT", body)
  }

  /**
   * Remove a volume
   */
  async remove(name: string, force: boolean = false): Promise<void> {
    const query = new URLSearchParams()
    query.set("force", force.toString())
    const path = `/volumes/${encodeURIComponent(name)}?${query.toString()}`
    await this.request(path, "DELETE")
  }

  /**
   * Prune unused volumes
   */
  async prune(options?: PruneVolumesOptions): Promise<VolumePruneResponse> {
    const params = options?.filters || {}
    const query = new URLSearchParams()

    if (Object.keys(params).length > 0) {
      query.set("filters", JSON.stringify(params))
    }

    const path = `/volumes/prune${query.toString() ? `?${query.toString()}` : ""}`
    const res = await this.request(path, "POST")
    return (await res.json()) as VolumePruneResponse
  }
}
