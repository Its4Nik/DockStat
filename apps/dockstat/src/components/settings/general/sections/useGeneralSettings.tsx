import type { DockStatConfigTableType } from "@dockstat/typings/types"
import { type PathItem, SidebarPaths } from "@dockstat/ui"
import { useContext, useMemo } from "react"
import { ConfigProviderContext } from "@/contexts/config"
import { useEdenMutation } from "@/hooks/eden/useEdenMutation"
import { useEdenQuery } from "@/hooks/useEdenQuery"
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

  // Fetch plugin routes like layout does
  const { data: frontendPluginRoutes } = useEdenQuery({
    queryKey: ["fetchFrontendPluginRoutes"],
    route: api.plugins.frontend.routes.get,
  })

  const removeNavLinkMutation = useEdenMutation({
    route: api.db.config.unpinItem.post,
    mutationKey: ["unpinItemMutation"],
    invalidateQueries: [["fetchAdditionalSettings"]],
    toast: {
      successTitle: "Link unpinned successfully",
      errorTitle: "Failed to unpin link",
    },
  })

  // Mutation to pin a nav item
  const pinLinkMutation = useEdenMutation({
    route: api.db.config.pinItem.post,
    mutationKey: ["pinItemMutation"],
    invalidateQueries: [["fetchAdditionalSettings"]],
    toast: {
      successTitle: "Link pinned successfully",
      errorTitle: "Failed to pin link",
    },
  })

  const updateAdditionalSettingsMutation = useEdenMutation({
    route: api.db.config.additionalSettings.post,
    mutationKey: ["updateAdditionalSettingsMutation"],
    invalidateQueries: [["fetchAdditionalSettings"]],
    toast: {
      successTitle: "Additional settings updated",
      errorTitle: "Failed to update additional settings",
    },
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
    removeNavLinkMutation.mutate({ slug, path })
  }

  const showRamUsageInNavbar = (showRamUsageInNavbar: boolean) => {
    updateAdditionalSettings({
      showBackendRamUsageInNavbar: showRamUsageInNavbar,
    })
  }

  // Process navigation links
  const allNavLinks: NavLink[] = Array.isArray(navLinks) ? navLinks : []

  // Process plugin routes - they have a different structure
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

  // Separate pinned and unpinned links
  const { pinnedLinks, availableLinks } = useMemo(() => {
    const pinned: NavLink[] = []
    const available: NavLink[] = []

    // Create a Set of already pinned paths for quick lookup
    const pinnedPaths = new Set(allNavLinks.map((link) => link.path))

    // All nav links are considered pinned
    allNavLinks.forEach((link) => {
      pinned.push(link)
    })

    // Create available links from plugin routes that aren't already pinned
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
