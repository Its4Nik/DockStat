import { useMemo } from "react"

type PathItem = {
  slug: string
  path: string
  isPinned?: boolean
  children?: PathItem[]
}

export const usePinnedPaths = (paths: PathItem[], pins: { path: string; slug: string }[]) => {
  return useMemo(() => {
    const checkIsPinned = (path: string, slug: string): boolean => {
      return pins.some((pin) => pin.path === path && pin.slug === slug)
    }

    const addPinStatus = (item: PathItem): PathItem => ({
      ...item,
      isPinned: checkIsPinned(item.path, item.slug),
      children: item.children?.map(addPinStatus),
    })

    return paths.map(addPinStatus)
  }, [pins, paths])
}
