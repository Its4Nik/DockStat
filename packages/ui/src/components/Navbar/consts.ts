export type PathItem = {
  slug: string
  path: string
  isPinned?: boolean
  children?: PathItem[]
}

export const floatVariants = {
  initial: { opacity: 0, y: -8, scale: 0.95 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -8, scale: 0.95 },
}

export const SidebarPaths: PathItem[] = [
  {
    path: "/",
    slug: "Home",
    children: [{ path: "/settings", slug: "Settings" }],
  },
  {
    path: "/clients",
    slug: "Clients",
    children: [
      {
        path: "/clients/configure",
        slug: "Manage Clients",
      },
    ],
  },
  {
    path: "/node",
    slug: "DockNode",
    children: [
      {
        path: "/node/stacks",
        slug: "Stacks",
      },
    ],
  },
  {
    path: "/extensions",
    slug: "Extension Repositories",
    children: [
      { path: "/extensions/plugins", slug: "Browse Plugins" },
      { path: "/extensions/themes", slug: "Explore themes" },
      { path: "/extensions/stacks", slug: "Stacks" },
    ],
  },
]
