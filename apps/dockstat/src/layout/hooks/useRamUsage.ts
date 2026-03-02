import { rssFeedEffect } from "@WSS"
import { useEffect, useState } from "react"

export function useRamUsage() {
  const [ramUsage, setRamUsage] = useState<string>("Connecting...")
  useEffect(() => rssFeedEffect(setRamUsage), [])
  return ramUsage
}
