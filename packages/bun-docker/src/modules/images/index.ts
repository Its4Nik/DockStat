import type { HeadersInit } from "bun"
import { BaseModule } from "../base"
import type {
  BuildCacheDiskUsage,
  BuildImageOptions,
  BuildInfo,
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
    const params = new URLSearchParams()

    if (options?.all) params.append("all", "true")
    if (options?.sharedSize) params.append("shared-size", "true")
    if (options?.digests) params.append("digests", "true")
    if (options?.manifests) params.append("manifests", "true")
    if (options?.identity) params.append("identity", "true")
    if (options?.filters) {
      params.append("filters", JSON.stringify(options.filters))
    }

    const query = params.toString()
    const path = `/images/json${query ? `?${query}` : ""}`
    const res = await this.request(path, "GET", undefined, undefined)
    return (await res.json()) as ImageSummary[]
  }

  /**
   * Create (pull) an image
   * @param options - Pull options
   * @returns Image creation info
   */
  async pull(options: PullImageOptions): Promise<CreateImageInfo[]> {
    const params = new URLSearchParams()

    if (options.fromImage) params.append("fromImage", options.fromImage)
    if (options.tag) params.append("tag", options.tag)
    if (options.platform) params.append("platform", options.platform)
    if (options.fromSrc) params.append("fromSrc", options.fromSrc)
    if (options.repo) params.append("repo", options.repo)
    if (options.message) params.append("message", options.message)
    if (options.changes) {
      options.changes.forEach((change) => params.append("changes", change))
    }

    const query = params.toString()
    const path = `/images/create${query ? `?${query}` : ""}`
    const headers: HeadersInit = {}
    if (options.authHeader) {
      headers["X-Registry-Auth"] = options.authHeader
    }

    const res = await this.request(path, "POST", options.inputImage, headers)
    return (await res.json()) as CreateImageInfo[]
  }

  /**
   * Inspect an image
   * @param name - Image name or ID
   * @param options - Inspect options
   * @returns Detailed image information
   */
  async inspect(name: string, options?: InspectImageOptions): Promise<ImageInspect> {
    const params = new URLSearchParams()

    if (options?.manifests) params.append("manifests", "true")
    if (options?.platform) params.append("platform", options.platform)

    const query = params.toString()
    const path = `/images/${name}/json${query ? `?${query}` : ""}`
    const res = await this.request(path, "GET", undefined, undefined)
    return (await res.json()) as ImageInspect
  }

  /**
   * Get image history
   * @param name - Image name or ID
   * @param options - History options
   * @returns Array of image history items
   */
  async history(name: string, options?: HistoryImageOptions): Promise<ImageHistoryResponseItem[]> {
    const params = new URLSearchParams()

    if (options?.platform) params.append("platform", options.platform)

    const query = params.toString()
    const path = `/images/${name}/history${query ? `?${query}` : ""}`
    const res = await this.request(path, "GET", undefined, undefined)
    return (await res.json()) as ImageHistoryResponseItem[]
  }

  /**
   * Push an image
   * @param name - Image name to push
   * @param options - Push options
   * @returns Push info
   */
  async push(name: string, options: PushImageOptions): Promise<PushImageInfo[]> {
    const params = new URLSearchParams()

    if (options.tag) params.append("tag", options.tag)
    if (options.platform) params.append("platform", options.platform)

    const query = params.toString()
    const path = `/images/${name}/push${query ? `?${query}` : ""}`
    const headers: HeadersInit = {
      "X-Registry-Auth": options.authHeader,
    }

    const res = await this.request(path, "POST", undefined, headers)
    return (await res.json()) as PushImageInfo[]
  }

  /**
   * Tag an image
   * @param name - Image name or ID to tag
   * @param options - Tag options
   */
  async tag(name: string, options: TagImageOptions): Promise<void> {
    const params = new URLSearchParams()

    if (options.repo) params.append("repo", options.repo)
    if (options.tag) params.append("tag", options.tag)

    const query = params.toString()
    const path = `/images/${name}/tag${query ? `?${query}` : ""}`
    await this.request(path, "POST", undefined, undefined)
  }

  /**
   * Remove an image
   * @param name - Image name or ID
   * @param options - Remove options
   * @returns Array of delete response items
   */
  async remove(name: string, options?: RemoveImageOptions): Promise<ImageDeleteResponseItem[]> {
    const params = new URLSearchParams()

    if (options?.force) params.append("force", "true")
    if (options?.noprune) params.append("noprune", "true")
    if (options?.platforms) {
      options.platforms.forEach((platform) => params.append("platforms", platform))
    }

    const query = params.toString()
    const path = `/images/${name}${query ? `?${query}` : ""}`
    const res = await this.request(path, "DELETE", undefined, undefined)
    return (await res.json()) as ImageDeleteResponseItem[]
  }

  /**
   * Search images
   * @param options - Search options
   * @returns Array of search results
   */
  async search(options: SearchImagesOptions): Promise<ImageSearchResponseItem[]> {
    const params = new URLSearchParams()

    if (options.term) params.append("term", options.term)
    if (options.limit) params.append("limit", options.limit.toString())
    if (options?.filters) {
      params.append("filters", JSON.stringify(options.filters))
    }

    const query = params.toString()
    const path = `/images/search${query ? `?${query}` : ""}`
    const res = await this.request(path, "GET", undefined, undefined)
    return (await res.json()) as ImageSearchResponseItem[]
  }

  /**
   * Prune unused images
   * @param options - Prune options
   * @returns Prune response
   */
  async prune(options?: PruneImagesOptions): Promise<ImagePruneResponse> {
    const params = new URLSearchParams()

    if (options?.filters) {
      params.append("filters", JSON.stringify(options.filters))
    }

    const query = params.toString()
    const path = `/images/prune${query ? `?${query}` : ""}`
    const res = await this.request(path, "POST", undefined, undefined)
    return (await res.json()) as ImagePruneResponse
  }

  /**
   * Export an image
   * @param name - Image name or ID
   * @param options - Export options
   * @returns Response with tarball
   */
  async get(name: string, options?: ExportImageOptions): Promise<Response> {
    const params = new URLSearchParams()

    if (options?.platform) {
      options.platform.forEach((platform) => params.append("platform", platform))
    }

    const query = params.toString()
    const path = `/images/${name}/get${query ? `?${query}` : ""}`
    return await this.request(path, "GET", undefined, undefined)
  }

  /**
   * Export multiple images
   * @param options - Export options
   * @returns Response with tarball
   */
  async getAll(options?: ExportAllImagesOptions): Promise<Response> {
    const params = new URLSearchParams()

    if (options?.names) {
      options.names.forEach((name) => params.append("names", name))
    }
    if (options?.platform) {
      options.platform.forEach((platform) => params.append("platform", platform))
    }

    const query = params.toString()
    const path = `/images/get${query ? `?${query}` : ""}`
    return await this.request(path, "GET", undefined, undefined)
  }

  /**
   * Load images
   * @param options - Load options
   * @returns Load response
   */
  async load(options: LoadImageOptions): Promise<unknown> {
    const params = new URLSearchParams()

    if (options?.quiet) params.append("quiet", "true")
    if (options?.platform) {
      options.platform.forEach((platform) => params.append("platform", platform))
    }

    const query = params.toString()
    const path = `/images/load${query ? `?${query}` : ""}`
    const res = await this.request(path, "POST", options.imagesTarball, undefined)
    return await res.json()
  }

  /**
   * Build an image
   * @param options - Build options
   * @returns Build info
   */
  async build(options: BuildImageOptions): Promise<BuildInfo[]> {
    const params = new URLSearchParams()

    if (options.dockerfile) params.append("dockerfile", options.dockerfile)
    if (options.t) params.append("t", options.t)
    if (options.extrahosts) params.append("extrahosts", options.extrahosts)
    if (options.remote) params.append("remote", options.remote)
    if (options.q) params.append("q", "true")
    if (options.nocache) params.append("nocache", "true")
    if (options.cachefrom) params.append("cachefrom", options.cachefrom)
    if (options.pull) params.append("pull", options.pull)
    if (options.rm !== undefined) params.append("rm", options.rm.toString())
    if (options.forcerm !== undefined) params.append("forcerm", options.forcerm.toString())
    if (options.memory) params.append("memory", options.memory.toString())
    if (options.memswap) params.append("memswap", options.memswap.toString())
    if (options.cpushares) params.append("cpushares", options.cpushares.toString())
    if (options.cpusetcpus) params.append("cpusetcpus", options.cpusetcpus)
    if (options.cpuperiod) params.append("cpuperiod", options.cpuperiod.toString())
    if (options.cpuquota) params.append("cpuquota", options.cpuquota.toString())
    if (options.buildargs) params.append("buildargs", options.buildargs)
    if (options.shmsize) params.append("shmsize", options.shmsize.toString())
    if (options.squash) params.append("squash", "true")
    if (options.labels) params.append("labels", options.labels)
    if (options.networkmode) params.append("networkmode", options.networkmode)
    if (options.platform) params.append("platform", options.platform)
    if (options.target) params.append("target", options.target)
    if (options.outputs) params.append("outputs", options.outputs)
    if (options.version) params.append("version", options.version)

    const query = params.toString()
    const path = `/build${query ? `?${query}` : ""}`
    const headers: HeadersInit = {
      "Content-Type": "application/x-tar",
    }
    if (options.authConfig) {
      headers["X-Registry-Config"] = options.authConfig
    }

    const res = await this.request(path, "POST", options.inputStream, headers)
    return (await res.json()) as BuildInfo[]
  }

  /**
   * Prune build cache
   * @param options - Prune build cache options
   * @returns Build cache disk usage
   */
  async pruneBuild(options?: PruneBuildCacheOptions): Promise<BuildCacheDiskUsage> {
    const params = new URLSearchParams()

    if (options?.all) params.append("all", "true")
    if (options?.["keep-storage"] !== undefined)
      params.append("keep-storage", options["keep-storage"].toString())
    if (options?.filters) {
      params.append("filters", JSON.stringify(options.filters))
    }

    const query = params.toString()
    const path = `/build/prune${query ? `?${query}` : ""}`
    const res = await this.request(path, "POST", undefined, undefined)
    return (await res.json()) as BuildCacheDiskUsage
  }

  /**
   * Commit a container as an image
   * @param container - Container ID or name
   * @param options - Commit options
   * @returns Image ID
   */
  async commit(
    container: string,
    options?: {
      repo?: string
      tag?: string
      comment?: string
      author?: string
      changes?: string[]
      pause?: boolean
      config?: any
    }
  ): Promise<ImageID> {
    const params = new URLSearchParams()

    if (options?.repo) params.append("repo", options.repo)
    if (options?.tag) params.append("tag", options.tag)
    if (options?.comment) params.append("comment", options.comment)
    if (options?.author) params.append("author", options.author)
    if (options?.changes) {
      options.changes.forEach((change) => params.append("changes", change))
    }
    if (options?.pause !== undefined) params.append("pause", options.pause.toString())

    const query = params.toString()
    const path = `/commit${query ? `?${query}` : ""}`
    const body = options?.config ? { container, config: options.config } : { container }
    const res = await this.request(path, "POST", body, undefined)
    return (await res.json()) as ImageID
  }
}
