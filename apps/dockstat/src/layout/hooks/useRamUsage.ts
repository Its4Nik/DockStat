import { useEffect, useState } from "react"
import { rssFeedEffect } from "@WSS"

export function useRamUsage() {
  const [ramUsage, setRamUsage] = useState<string>("Connecting...")
  useEffect(() => rssFeedEffect(setRamUsage), [])
  return ramUsage
}
