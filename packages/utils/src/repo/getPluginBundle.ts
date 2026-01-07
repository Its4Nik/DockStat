import type { RepoType } from "@dockstat/typings/types"
import { parseFromDBToRepoLink } from "./parseRepoLink"

export async function getPluginBundle(type: RepoType["type"], source: string) {
  const link = parseFromDBToRepoLink(type, source, "bundle/index.js")

  const data = await fetch(link, { method: "GET" })
  const bundle = await data.text()

  if (bundle === "404: Not Found") {
    throw new Error(`${bundle} - ${link}`)
  }

  return bundle
}
