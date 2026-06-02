import type { RepoManifestType, RepoType } from "@dockstat/typings/types"
import { repo } from "@dockstat/utils"
import Elysia from "elysia"
import { repoCache } from "../../cache"
import { DockStatDB } from "../../database"

const RepositoryRoutes = new Elysia({
  detail: { tags: ["repositories"] },
  prefix: "/repositories",
})
  .get("/all", () => DockStatDB.repositoriesTable.select(["*"]).all(), {
    detail: {
      description:
        "Retrieve all repositories registered in the database. Returns a list of repository records containing metadata such as name, type, source, and other configuration details.",
      summary: "Get All Repositories",
    },
  })
  .get(
    "/all-manifests",
    async () => {
      // Use cache to avoid re-fetching manifests on every request
      return repoCache.getOrComputeAsync(
        "all-manifests",
        async () => {
          const allRepos = DockStatDB.repositoriesTable.select(["*"]).all()

          // Parallel fetching instead of sequential - major performance improvement
          const results = await Promise.all(
            allRepos.map(async (repoElement) => {
              const link = repo.parseFromDBToRepoLink(repoElement.type, repoElement.source)

              try {
                const response = await fetch(link)
                if (!response.ok) {
                  console.warn(`Failed to fetch ${link}: ${response.statusText}`)
                  return null
                }

                const text = await response.text()
                const contentType = response.headers.get("content-type") || ""

                let data: unknown

                if (contentType.includes("application/json") || link.endsWith(".json")) {
                  data = JSON.parse(text)
                } else if (
                  contentType.includes("yaml") ||
                  contentType.includes("yml") ||
                  link.endsWith(".yaml") ||
                  link.endsWith(".yml")
                ) {
                  data = Bun.YAML.parse(text)
                } else {
                  // Fallback: try YAML then JSON
                  try {
                    data = Bun.YAML.parse(text)
                  } catch {
                    data = JSON.parse(text)
                  }
                }

                return {
                  key: repoElement.name,
                  value: {
                    data: data as RepoManifestType,
                    repoSource: repoElement.source,
                    type: repoElement.type,
                  },
                }
              } catch (error) {
                console.error(`Error processing ${link}:`, error)
                return null
              }
            })
          )

          // Build result object from parallel results
          const result: Record<
            string,
            {
              data: RepoManifestType
              type: RepoType["type"]
              repoSource: string
            }
          > = {}

          for (const item of results) {
            if (item) {
              result[item.key] = item.value
            }
          }

          return result
        },
        5 * 60_000 // 5 minute TTL
      )
    },
    {
      detail: {
        description:
          "Fetch and parse manifest files from all registered repositories. Supports both JSON and YAML formats. Results are cached for 5 minutes. Returns a dictionary mapping repository names to their parsed manifest data, including the manifest content, source type, and repository source URL.",
        summary: "Get All Repository Manifests",
      },
    }
  )

export default RepositoryRoutes
