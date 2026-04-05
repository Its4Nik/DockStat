import { BaseModule } from "../base"
import type {
  CreateVolumeRoute,
  DeleteVolumeRoute,
  InspectVolumeRoute,
  ListVolumesRoute,
  PruneVolumeRoute,
  UpdateVolumeRoute,
} from "./types"

/**
 * Volume module for Docker API
 */
export class VolumeModule extends BaseModule {
  /**
   * List volumes
   */
  async list(options?: ListVolumesRoute["parameters"]["query"]) {
    const res = await this.request(`/volumes`, "GET", undefined, undefined, options)
    return (await res.json()) as ListVolumesRoute["responses"]["200"]["content"]["application/json"]
  }

  /**
   * Create a volume
   */
  async create(config: CreateVolumeRoute["requestBody"]["content"]["application/json"]) {
    const res = await this.request("/volumes/create", "POST", config)
    return (await res.json()) as CreateVolumeRoute["responses"]["201"]["content"]["application/json"]
  }

  /**
   * Inspect a volume
   */
  async inspect(name: string) {
    const res = await this.request(`/volumes/${encodeURIComponent(name)}`)
    return (await res.json()) as InspectVolumeRoute["responses"]["200"]["content"]["application/json"]
  }

  /**
   * Update a volume (for cluster volumes only)
   */
  async update(
    name: string,
    body: NonNullable<UpdateVolumeRoute["requestBody"]>["content"]["application/json"],
    version: number
  ): Promise<void> {
    await this.request(`/volumes/${encodeURIComponent(name)}`, "PUT", body, undefined, {
      version,
    })
  }

  /**
   * Remove a volume
   */
  async remove(name: string, options: DeleteVolumeRoute["parameters"]["query"]) {
    await this.request(
      `/volumes/${encodeURIComponent(name)}`,
      "DELETE",
      undefined,
      undefined,
      options
    )
  }

  /**
   * Prune unused volumes
   */
  async prune(options?: PruneVolumeRoute["parameters"]["query"]) {
    const res = await this.request(`/volumes/prune`, "POST", undefined, undefined, options)
    return (await res.json()) as PruneVolumeRoute["responses"]["200"]["content"]["application/json"]
  }
}
