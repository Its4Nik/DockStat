import type { DockStatConfigTableType } from "@dockstat/typings/types"
import { type PathItem, SidebarPaths } from "@dockstat/ui"
import { eden } from "@dockstat/utils/react"
import { useContext, useMemo } from "react"
import { ConfigProviderContext } from "@/contexts/config"
import { useConfigMutations } from "@/hooks/mutations"
import { api } from "@/lib/api"

export type NavLink = {
  slug: string
  path: string
}

export type PluginLink = {
  name: string
  route: string
  icon?: string
}

function extractNameSlugs(items: PathItem[]): NavLink[] {
  return items.flatMap((item) => [
    { slug: item.slug, path: item.path },
    ...(item.children ? extractNameSlugs(item.children) : []),
  ])
}

const defaultSidebarPaths = extractNameSlugs(SidebarPaths)

export function useGeneralSettings() {
  const { additionalSettings, navLinks } = useContext(ConfigProviderContext)

  const { pinLinkMutation, unpinLinkMutation, updateAdditionalSettingsMutation } =
    useConfigMutations()

  const { data: frontendPluginRoutes } = eden.useEdenQuery({
    queryKey: ["fetchFrontendPluginRoutes"],
    route: api.plugins.frontend.routes.get,
  })

  const updateAdditionalSettings = (
    additionalSettings: DockStatConfigTableType["additionalSettings"]
  ) => {
    updateAdditionalSettingsMutation.mutate({ additionalSettings })
  }

  const pinLink = (slug: string, path: string) => {
    if (!slug || !path) return
    pinLinkMutation.mutate({ slug, path })
  }

  const unpinLink = (slug: string, path: string) => {
    if (!slug || !path) return
    unpinLinkMutation.mutate({ slug, path })
  }

  const showRamUsageInNavbar = (showRamUsageInNavbar: boolean) => {
    updateAdditionalSettings({
      showBackendRamUsageInNavbar: showRamUsageInNavbar,
    })
  }

  const allNavLinks: NavLink[] = Array.isArray(navLinks) ? navLinks : []

  const pluginLinks: PluginLink[] = useMemo(() => {
    if (!Array.isArray(frontendPluginRoutes)) return []

    const links: PluginLink[] = []
    frontendPluginRoutes.forEach((plugin) => {
      if (plugin.paths && Array.isArray(plugin.paths)) {
        plugin.paths.forEach((path) => {
          links.push({
            name: path.metaTitle || plugin.pluginName,
            route: path.fullPath,
          })
        })
      }
    })
    return links
  }, [frontendPluginRoutes])

  const { pinnedLinks, availableLinks } = useMemo(() => {
    const pinned: NavLink[] = []
    const available: NavLink[] = []

    const pinnedPaths = new Set(allNavLinks.map((link) => link.path))

    allNavLinks.forEach((link) => {
      pinned.push(link)
    })

    pluginLinks.forEach((plugin) => {
      if (!pinnedPaths.has(plugin.route)) {
        available.push({
          slug: plugin.name,
          path: plugin.route,
        })
      }
    })

    defaultSidebarPaths.forEach((route) => {
      if (!pinnedPaths.has(route.path)) {
        available.push(route)
      }
    })

    return { pinnedLinks: pinned, availableLinks: available }
  }, [allNavLinks, pluginLinks])

  return {
    pinnedLinks,
    availableLinks,
    pinLink,
    unpinLink,
    additionalSettings,
    pluginLinks,
    allNavLinks,
    showRamUsageInNavbar,
  }
}
