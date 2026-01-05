type PathItem = {
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
  },
  { path: "/extensions", slug: "Extensions" },
]
