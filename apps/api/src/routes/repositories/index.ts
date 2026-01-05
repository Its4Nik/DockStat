import type { RepoManifestType, RepoType } from "@dockstat/typings/types"
import { parseFromDBToRepoLink } from "@dockstat/utils/src/repo"
import Elysia from "elysia"
import { DockStatDB } from "../../database"

const RepositoryRoutes = new Elysia({
  prefix: "/repositories",
  detail: { tags: ["repositories"] },
})
  .get("/all", () => DockStatDB.repositoriesTable.select(["*"]).all())
  .get("/all-manifests", async () => {
    const allRepos = DockStatDB.repositoriesTable.select(["*"]).all()

    const result: Record<
      string,
      {
        data: RepoManifestType
        type: RepoType["type"]
        repoSource: string
      }
    > = {}

    for (const repo of allRepos) {
      const link = parseFromDBToRepoLink(repo.type, repo.source)

      try {
        const response = await fetch(link)
        if (!response.ok) {
          console.warn(`Failed to fetch ${link}: ${response.statusText}`)
          continue
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

        result[repo.name] = {
          data: data as RepoManifestType,
          type: repo.type,
          repoSource: repo.source,
        }
      } catch (error) {
        console.error(`Error processing ${link}:`, error)
      }
    }

    return result
  })

export default RepositoryRoutes
