import { useCallback, useEffect, useState } from "react"
import type { PluginPageData } from "@/components/plugins/id/types"
import type { PageTemplate } from "@dockstat/template-renderer"

export function usePluginState(
  initialData: PluginPageData["initialData"] | undefined,
  parsedTemplate: PageTemplate | null
) {
  const [state, setState] = useState<Record<string, unknown>>({})
  const [externalData, setExternalData] = useState<Record<string, unknown>>({})

  useEffect(() => {
    if (initialData) {
      setState((prev) => ({
        ...parsedTemplate?.state?.initial,
        ...prev,
        ...initialData.state,
      }))
      setExternalData(initialData.data)
    }
  }, [initialData, parsedTemplate?.state?.initial])

  const handleStateChange = useCallback((updates: Record<string, unknown>) => {
    setState((prev) => ({ ...prev, ...updates }))
  }, [])

  const updateExternalData = useCallback((key: string, value: unknown) => {
    setExternalData((prev) => ({ ...prev, [key]: value }))
  }, [])

  return {
    state,
    externalData,
    setState,
    setExternalData,
    handleStateChange,
    updateExternalData,
  }
}
