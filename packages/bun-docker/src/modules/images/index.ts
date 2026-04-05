import type { HeadersInit } from "bun"
import { BaseModule } from "../base"
import type {
  BuildPruneRoute,
  ImageBuildRoute,
  ImageCommitRoute,
  ImageCreateRoute,
  ImageDeleteRoute,
  ImageGetAllRoute,
  ImageGetRoute,
  ImageHistoryRoute,
  ImageInspectRoute,
  ImageListRoute,
  ImageLoadRoute,
  ImagePruneRoute,
  ImagePushRoute,
  ImageSearchRoute,
  ImageTagRoute,
} from "./types"

export class Images extends BaseModule {
  async list(options?: ImageListRoute["parameters"]["query"]) {
    const res = await this.request("/images/json", "GET", undefined, undefined, options)
    return (await res.json()) as ImageListRoute["responses"]["200"]["content"]["application/json"]
  }

  async create(
    body?: NonNullable<ImageCreateRoute["requestBody"]>["content"]["text/plain"],
    options?: ImageCreateRoute["parameters"]["query"] & ImageCreateRoute["parameters"]["header"]
  ) {
    const headers: HeadersInit = {}
    if (options?.["X-Registry-Auth"]) {
      headers["X-Registry-Auth"] = options["X-Registry-Auth"]
    }
    const res = await this.request("/images/create", "POST", body, headers, options)
    return (await res.json()) as ImageCreateRoute["responses"]["200"]["content"]
  }

  async inspect(name: string, options?: ImageInspectRoute["parameters"]["query"]) {
    const res = await this.request(`/images/${name}/json`, "GET", undefined, undefined, options)
    return (await res.json()) as ImageInspectRoute["responses"]["200"]["content"]["application/json"]
  }

  async history(name: string, options?: ImageHistoryRoute["parameters"]["query"]) {
    const res = await this.request(`/images/${name}/history`, "GET", undefined, undefined, options)
    return (await res.json()) as ImageHistoryRoute["responses"]["200"]["content"]["application/json"]
  }

  async push(
    name: string,
    options?: ImagePushRoute["parameters"]["query"] & ImagePushRoute["parameters"]["header"]
  ) {
    const headers: HeadersInit = {}
    if (options?.["X-Registry-Auth"]) {
      headers["X-Registry-Auth"] = options["X-Registry-Auth"]
    }
    const res = await this.request(`/images/${name}/push`, "POST", undefined, headers, options)
    return (await res.json()) as ImagePushRoute["responses"]["200"]["content"]
  }

  async tag(name: string, options?: ImageTagRoute["parameters"]["query"]) {
    return await this.request(`/images/${name}/tag`, "POST", undefined, undefined, options)
  }

  async delete(name: string, options?: ImageDeleteRoute["parameters"]["query"]) {
    const res = await this.request(`/images/${name}`, "DELETE", undefined, undefined, options)
    return (await res.json()) as ImageDeleteRoute["responses"]["200"]["content"]["application/json"]
  }

  async search(options: ImageSearchRoute["parameters"]["query"]) {
    const res = await this.request("/images/search", "GET", undefined, undefined, options)
    return (await res.json()) as ImageSearchRoute["responses"]["200"]["content"]["application/json"]
  }

  async prune(options?: ImagePruneRoute["parameters"]["query"]) {
    const res = await this.request("/images/prune", "POST", undefined, undefined, options)
    return (await res.json()) as ImagePruneRoute["responses"]["200"]["content"]["application/json"]
  }

  async get(name: string, options?: ImageGetRoute["parameters"]["query"]) {
    const res = await this.request(`/images/${name}/get`, "GET", undefined, undefined, options)
    return (await res.json()) as ImageGetRoute["responses"]["200"]["content"]["application/x-tar"]
  }

  async getAll(options?: ImageGetAllRoute["parameters"]["query"]) {
    const res = await this.request("/images/get", "GET", undefined, undefined, options)
    return (await res.json()) as ImageGetAllRoute["responses"]["200"]["content"]["application/x-tar"]
  }

  async load(
    imagesTarball: NonNullable<ImageLoadRoute["requestBody"]>["content"]["application/x-tar"],
    options?: ImageLoadRoute["parameters"]["query"]
  ) {
    const res = await this.request("/images/load", "POST", imagesTarball, undefined, options)
    return (await res.json()) as ImageLoadRoute["responses"]["200"]["content"]
  }

  async build(
    dockerfile?: NonNullable<ImageBuildRoute["requestBody"]>["content"]["application/octet-stream"],
    options?: ImageBuildRoute["parameters"]["query"] & ImageBuildRoute["parameters"]["header"]
  ) {
    const headers: HeadersInit = {}
    if (options?.["X-Registry-Config"]) {
      headers["X-Registry-Config"] = options["X-Registry-Config"]
    }
    const res = await this.request("/build", "POST", dockerfile, headers, options)

    return (await res.json()) as ImageBuildRoute["responses"]["200"]["content"]
  }

  async pruneBuildCache(options?: BuildPruneRoute["parameters"]["query"]) {
    const res = await this.request("/build/prune", "POST", undefined, undefined, options)
    return (await res.json()) as BuildPruneRoute["responses"]["200"]["content"]["application/json"]
  }

  async commit(
    container: string,
    body?: NonNullable<ImageCommitRoute["requestBody"]>["content"]["application/json"],
    options?: ImageCommitRoute["parameters"]["query"]
  ) {
    const res = await this.request("/commit", "POST", body, undefined, { ...options, container })
    return (await res.json()) as ImageCommitRoute["responses"]["201"]["content"]["application/json"]
  }
}
