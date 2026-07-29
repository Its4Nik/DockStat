import { useRssFeed } from "@WSS"

export function useRamUsage() {
  const ramUsage = useRssFeed()
  return ramUsage
}
