import type { HeadersInit } from "bun"
import { BaseModule } from "../base"
import type {
  BuildCacheDiskUsage,
  BuildImageOptions,
  CommitBody,
  CommitParams,
  CreateImageInfo,
  ExportAllImagesOptions,
  ExportImageOptions,
  HistoryImageOptions,
  ImageDeleteResponseItem,
  ImageHistoryResponseItem,
  ImageID,
  ImageInspect,
  ImagePruneResponse,
  ImageSearchResponseItem,
  ImageSummary,
  InspectImageOptions,
  ListImagesOptions,
  LoadImageOptions,
  PruneBuildCacheOptions,
  PruneImagesOptions,
  PullImageOptions,
  PushImageInfo,
  PushImageOptions,
  RemoveImageOptions,
  SearchImagesOptions,
  TagImageOptions,
} from "./types"

/**
 * Images Module - handles all Docker image operations
 */
export class ImagesModule extends BaseModule {
  /**
   * List images
   * @param options - List options
   * @returns Array of image summaries
   */
  async list(options?: ListImagesOptions): Promise<ImageSummary[]> {
    const res = await this.request(`/images/json`, "GET", undefined, undefined, options)
    return (await res.json()) as ImageSummary[]
  }

  /**
   * Create (pull) an image
   * @param options - Pull options
   * @returns Image creation info
   */
  async pull(options: PullImageOptions): Promise<CreateImageInfo[]> {
    const headers: HeadersInit = {}
    if (options.authHeader) {
      headers["X-Registry-Auth"] = options.authHeader
    }

    const res = await this.request(`/images/create`, "POST", options.inputImage, headers, options)
    return (await res.json()) as CreateImageInfo[]
  }

  /**
   * Inspect an image
   * @param name - Image name or ID
   * @param options - Inspect options
   * @returns Detailed image information
   */
  async inspect(name: string, options?: InspectImageOptions): Promise<ImageInspect> {
    const res = await this.request(`/images/${name}/json`, "GET", undefined, undefined, options)
    return (await res.json()) as ImageInspect
  }

  /**
   * Get image history
   * @param name - Image name or ID
   * @param options - History options
   * @returns Array of image history items
   */
  async history(name: string, options?: HistoryImageOptions): Promise<ImageHistoryResponseItem[]> {
    const res = await this.request(`/images/${name}/history`, "GET", undefined, undefined, options)
    return (await res.json()) as ImageHistoryResponseItem[]
  }

  /**
   * Push an image
   * @param name - Image name to push
   * @param options - Push options
   * @returns Push info
   */
  async push(name: string, options: PushImageOptions): Promise<PushImageInfo[]> {
    const headers: HeadersInit = {
      "X-Registry-Auth": options.authHeader,
    }

    const res = await this.request(`/images/${name}/push`, "POST", undefined, headers, options)
    return (await res.json()) as PushImageInfo[]
  }

  /**
   * Tag an image
   * @param name - Image name or ID to tag
   * @param options - Tag options
   */
  async tag(name: string, options: TagImageOptions): Promise<void> {
    await this.request(`/images/${name}/tag`, "POST", undefined, undefined, options)
  }

  /**
   * Remove an image
   * @param name - Image name or ID
   * @param options - Remove options
   * @returns Array of delete response items
   */
  async remove(name: string, options?: RemoveImageOptions): Promise<ImageDeleteResponseItem[]> {
    const res = await this.request(`/images/${name}`, "DELETE", undefined, undefined, options)
    return (await res.json()) as ImageDeleteResponseItem[]
  }

  /**
   * Search images
   * @param options - Search options
   * @returns Array of search results
   */
  async search(options: SearchImagesOptions): Promise<ImageSearchResponseItem[]> {
    const res = await this.request(`/images/search`, "GET", undefined, undefined, options)
    return (await res.json()) as ImageSearchResponseItem[]
  }

  /**
   * Prune unused images
   * @param options - Prune options
   * @returns Prune response
   */
  async prune(options?: PruneImagesOptions): Promise<ImagePruneResponse> {
    const res = await this.request(`/images/prune`, "POST", undefined, undefined, options)
    return (await res.json()) as ImagePruneResponse
  }

  /**
   * Export an image
   * @param name - Image name or ID
   * @param options - Export options
   * @returns Response with tarball
   */
  async get(name: string, options?: ExportImageOptions): Promise<Response> {
    return await this.request(`/images/${name}/get`, "GET", undefined, undefined, options)
  }

  /**
   * Export multiple images
   * @param options - Export options
   * @returns Response with tarball
   */
  async getAll(options?: ExportAllImagesOptions): Promise<Response> {
    return await this.request(`/images/get`, "GET", undefined, undefined, options)
  }

  /**
   * Load images
   * @param options - Load options
   * @returns Load response
   */
  async load(options: LoadImageOptions): Promise<unknown> {
    const res = await this.request(
      `/images/load`,
      "POST",
      options.imagesTarball,
      undefined,
      options
    )
    return await res.json()
  }

  /**
   * Build an image from a tar archive with a Dockerfile in it.
   * The Dockerfile specifies how the image is built from the tar archive.
   * It is typically in the archive's root,
   * but can be at a different path or have a different name by specifying the dockerfile parameter.
   * See the Dockerfile reference for more information.
   *
   * The Docker daemon performs a preliminary validation of the Dockerfile before starting the build,
   * and returns an error if the syntax is incorrect.
   * After that, each instruction is run one-by-one until the ID of the new image is output.
   *
   * The build is canceled if the client drops the connection by quitting or being killed.
   * @param options - Build options
   * @returns Build info
   */
  async build(options: BuildImageOptions): Promise<boolean> {
    const headers: HeadersInit = {
      "Content-Type": "application/x-tar",
    }
    if (options.authConfig) {
      headers["X-Registry-Config"] = options.authConfig
    }

    await this.request(`/build`, "POST", options.inputStream, headers, options)
    return true
  }

  /**
   * Prune build cache
   * @param options - Prune build cache options
   * @returns Build cache disk usage
   */
  async pruneBuild(options?: PruneBuildCacheOptions): Promise<BuildCacheDiskUsage> {
    const res = await this.request(`/build/prune`, "POST", undefined, undefined, options)
    return (await res.json()) as BuildCacheDiskUsage
  }

  /**
   * Commit a container as an image
   * @param container - Container ID or name
   * @param options - Commit options
   * @returns Image ID
   */
  async commit(containerConfig: CommitBody, options: CommitParams): Promise<ImageID> {
    const res = await this.request(`/commit`, "POST", containerConfig, undefined, options)
    return (await res.json()) as ImageID
  }
}
