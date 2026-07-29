import { useContext } from "react"
import { EdenContext } from "./EdenContext"
import type { Client } from "./index"

export function useEdenClient(): Client {
  const ctx = useContext(EdenContext)
  if (!ctx) {
    throw new Error("useEdenClient must be used within an <EdenProvider>")
  }
  return ctx
}
