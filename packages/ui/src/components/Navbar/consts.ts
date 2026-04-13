export type PathItem = {
  slug: string
  path: string
  isPinned?: boolean
  children?: PathItem[]
}

export const floatVariants = {
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.95, y: -8 },
  initial: { opacity: 0, scale: 0.95, y: -8 },
}

export const SidebarPaths: PathItem[] = [
  {
    children: [
      { path: "/settings", slug: "Settings" },
      { path: "/dashboards", slug: "Dashboards" },
      { path: "/graph", slug: "Graph" },
    ],
    path: "/",
    slug: "Home",
  },
  {
    children: [
      {
        path: "/clients/configure",
        slug: "Manage Clients",
      },
    ],
    path: "/clients",
    slug: "Clients",
  },
  {
    children: [
      {
        path: "/node/stacks",
        slug: "Stacks",
      },
    ],
    path: "/node",
    slug: "DockNode",
  },
  {
    children: [
      { path: "/extensions/plugins", slug: "Browse Plugins" },
      { path: "/extensions/themes", slug: "Explore themes" },
      { path: "/extensions/stacks", slug: "Stacks" },
    ],
    path: "/extensions",
    slug: "Extension Repositories",
  },
]
