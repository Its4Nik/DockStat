import type { DockStatConfigTableType } from "@dockstat/typings/types"
import { api } from "../api"
import { extractEdenError } from "@dockstat/utils"

export async function pinNavLink(navLinks: DockStatConfigTableType["nav_links"][number]) {
  const { data, error } = await api.api.v2.db.config.pinItem.post(navLinks)

  if (error) {
    throw new Error(extractEdenError({ data, error }))
  }

  return data
}
