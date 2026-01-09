export type PathItem = {
  slug: string
  path: string
  isPinned?: boolean
  children?: PathItem[]
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
    path: "/extensions",
    slug: "Extensions",
    children: [
      { path: "/extensions/plugins", slug: "Browse Plugins" },
      { path: "/extensions/themes", slug: "Explore themes" },
      { path: "/extensions/stacks", slug: "Stacks" },
    ],
  },
]
