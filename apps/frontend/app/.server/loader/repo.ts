import { repoCache } from "../cache"
import Singletons from "../singletons"

export const RepoLoaders = {
  getAll: () => Singletons.DB.repositoriesTable.select(["*"]).all(),
  getAllManifests: () =>
    repoCache.getOrComputeAsync(
      "all-manifests",
      async () => {
        const { repo } = await import("@dockstat/utils")
        const allRepos = Singletons.DB.repositoriesTable.select(["*"]).all()

        const results = await Promise.all(
          allRepos.map(async (repoElement) => {
            const link = repo.parseFromDBToRepoLink(repoElement.type, repoElement.source)

            try {
              const response = await fetch(link)
              if (!response.ok) return null

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
                try {
                  data = Bun.YAML.parse(text)
                } catch {
                  data = JSON.parse(text)
                }
              }

              return {
                key: repoElement.name,
                value: { data, repoSource: repoElement.source, type: repoElement.type },
              }
            } catch {
              return null
            }
          })
        )

        const result: Record<string, { data: unknown; repoSource: string; type: string }> = {}
        for (const item of results) if (item) result[item.key] = item.value
        return result
      },
      5 * 60_000
    ),
}
