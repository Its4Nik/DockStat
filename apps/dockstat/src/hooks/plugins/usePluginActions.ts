import type { ActionConfig, PageTemplate } from "@dockstat/template-renderer"
import { useCallback, useRef } from "react"
import type { ResolvedAction } from "@/components/plugins/id/types"
import { api } from "@/lib/api"
import { useEdenRouteMutation } from "../eden/useEdenRouteMutation"
import { getValueByPath } from "./utils"

type ActionResult = {
  actionId: string
  success: boolean
  data?: unknown
  error?: string
  executedAt: number
}

type UsePluginActionsParams = {
  pluginId: number
  routePath: string
  actions: ResolvedAction[]
  parsedTemplate: PageTemplate | null
  state: Record<string, unknown>
  onStateChange: (updates: Record<string, unknown>) => void
  onNavigate: (path: string) => void
  reloadLoaders: (loaderIds?: string[]) => Promise<void>
}

export function usePluginActions({
  pluginId,
  routePath,
  actions,
  parsedTemplate,
  state,
  onStateChange,
  onNavigate,
  reloadLoaders,
}: UsePluginActionsParams) {
  const customHandlersRef = useRef<Map<string, (payload?: unknown) => void | Promise<void>>>(
    new Map()
  )

  // Correct route builder
  const actionMutation = useEdenRouteMutation({
    mutationKey: ["executeAction", String(pluginId)],
    routeBuilder: ({ actionId }: { actionId: string }) =>
      api.plugins.frontend({ pluginId }).actions({ actionId }).execute.post,
  })

  const executeApiAction = useCallback(
    async (action: ResolvedAction, payload?: unknown) => {
      const res = await actionMutation.mutateAsync({
        params: { actionId: action.id },
        body: { path: routePath, payload, state },
      })

      const result = (res as { result?: ActionResult }).result
      if (!result) return

      if (result.success && action.onSuccess) {
        if (action.onSuccess.setState) {
          const updates: Record<string, unknown> = {}
          for (const [key, value] of Object.entries(action.onSuccess.setState)) {
            if (typeof value === "string" && value.startsWith("result.")) {
              updates[key] = getValueByPath(result.data as Record<string, unknown>, value.slice(7))
            } else {
              updates[key] = value
            }
          }
          onStateChange(updates)
        }
        if (action.onSuccess.navigate) onNavigate(action.onSuccess.navigate)
      } else if (!result.success && action.onError?.setState) {
        onStateChange(action.onError.setState)
      }

      return result
    },
    [actionMutation, routePath, state, onStateChange, onNavigate]
  )

  const handleAction = useCallback(
    async (actionId: string, payload?: unknown) => {
      const action = actions.find((a) => a.id === actionId)
      const templateAction = parsedTemplate?.actions?.find((a) => a.id === actionId)
      const actionDef = (action || templateAction) as
        | (ActionConfig & { handler?: string })
        | undefined

      if (!actionDef) {
        const custom = customHandlersRef.current.get(actionId)
        if (custom) await custom(payload)
        return
      }

      if (actionDef.confirm) {
        const confirmed = window.confirm(actionDef.confirm.message || "Are you sure?")
        if (!confirmed) return
      }

      switch (actionDef.type) {
        case "setState":
          if (actionDef.stateUpdates) onStateChange(actionDef.stateUpdates)
          break
        case "navigate":
          if (actionDef.path) onNavigate(actionDef.path)
          break
        case "api":
          if (action) await executeApiAction(action, payload)
          break
        case "reload":
          await reloadLoaders(actionDef.loaderIds)
          break
        case "custom": {
          const handler = customHandlersRef.current.get(actionDef.handler || actionId)
          if (handler) await handler(payload)
          break
        }
      }
    },
    [actions, parsedTemplate, onStateChange, onNavigate, executeApiAction, reloadLoaders]
  )

  const registerCustomHandler = useCallback(
    (id: string, handler: (payload?: unknown) => void | Promise<void>) => {
      customHandlersRef.current.set(id, handler)
      return () => customHandlersRef.current.delete(id)
    },
    []
  )

  return {
    handleAction,
    registerCustomHandler,
    isExecutingAction: actionMutation.isPending,
  }
}
