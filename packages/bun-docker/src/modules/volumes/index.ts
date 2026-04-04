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
    const res = await this.request(`/volumes`, "GET", undefined, undefined, options)
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
    await this.request(`/volumes/${encodeURIComponent(name)}`, "PUT", body, undefined, {
      version,
    })
  }

  /**
   * Remove a volume
   */
  async remove(name: string, force: boolean = false): Promise<void> {
    await this.request(`/volumes/${encodeURIComponent(name)}`, "DELETE", undefined, undefined, {
      force,
    })
  }

  /**
   * Prune unused volumes
   */
  async prune(options?: PruneVolumesOptions): Promise<VolumePruneResponse> {
    const res = await this.request(`/volumes/prune`, "POST", undefined, undefined, options)
    return (await res.json()) as VolumePruneResponse
  }
}
