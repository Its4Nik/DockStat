/**
 * Template Hooks
 *
 * React hooks for managing template state, actions, and rendering.
 */

import { useState, useCallback, useMemo } from "react"
import type { PageTemplate, TemplateFragment } from "../types"

/**
 * State returned by useTemplateState hook
 */
export interface UseTemplateStateResult {
  /** Current state values */
  state: Record<string, unknown>
  /** Update state with partial updates */
  setState: (updates: Record<string, unknown>) => void
  /** Reset state to initial values */
  resetState: () => void
  /** Get a specific state value by key */
  getValue: <T = unknown>(key: string) => T | undefined
  /** Set a specific state value by key */
  setValue: (key: string, value: unknown) => void
}

/**
 * Hook for managing template state
 *
 * @param template - The template containing initial state definition
 * @param initialOverrides - Optional initial state overrides
 * @returns State management utilities
 */
export function useTemplateState(
  template: PageTemplate,
  initialOverrides?: Record<string, unknown>
): UseTemplateStateResult {
  const initialState = useMemo(() => {
    return { ...template.state?.initial, ...initialOverrides }
  }, [template.state?.initial, initialOverrides])

  const [state, setStateInternal] = useState<Record<string, unknown>>(initialState)

  const setState = useCallback((updates: Record<string, unknown>) => {
    setStateInternal((prev) => ({ ...prev, ...updates }))
  }, [])

  const resetState = useCallback(() => {
    setStateInternal(initialState)
  }, [initialState])

  const getValue = useCallback(
    <T = unknown>(key: string): T | undefined => {
      return state[key] as T | undefined
    },
    [state]
  )

  const setValue = useCallback((key: string, value: unknown) => {
    setStateInternal((prev) => ({ ...prev, [key]: value }))
  }, [])

  return {
    state,
    setState,
    resetState,
    getValue,
    setValue,
  }
}

/**
 * Result from useTemplateActions hook
 */
export interface UseTemplateActionsResult {
  /** Trigger an action by ID */
  triggerAction: (actionId: string, payload?: unknown) => void
  /** Register a custom action handler */
  registerHandler: (actionId: string, handler: (payload?: unknown) => void) => void
  /** Unregister a custom action handler */
  unregisterHandler: (actionId: string) => void
}

/**
 * Hook for managing template actions
 *
 * @param template - The template containing action definitions
 * @param setState - State update function from useTemplateState
 * @param navigate - Navigation function
 * @returns Action management utilities
 */
export function useTemplateActions(
  template: PageTemplate,
  setState: (updates: Record<string, unknown>) => void,
  navigate?: (path: string) => void
): UseTemplateActionsResult {
  const [customHandlers, setCustomHandlers] = useState<Record<string, (payload?: unknown) => void>>(
    {}
  )

  const triggerAction = useCallback(
    (actionId: string, payload?: unknown) => {
      // Check for custom handler first
      const customHandler = customHandlers[actionId]
      if (customHandler) {
        customHandler(payload)
        return
      }

      // Find action in template
      const action = template.actions?.find((a) => a.id === actionId)
      if (!action) {
        console.warn(`Action not found: ${actionId}`)
        return
      }

      // Handle built-in action types
      switch (action.type) {
        case "setState":
          if (action.stateUpdates) {
            setState(action.stateUpdates)
          }
          break
        case "navigate":
          if (action.path && navigate) {
            navigate(action.path)
          } else if (action.path && !navigate) {
            console.warn(`Navigate action "${actionId}" requires navigate function`)
          }
          break
        case "custom":
          console.warn(`Custom action "${actionId}" requires a registered handler`)
          break
      }
    },
    [template.actions, setState, navigate, customHandlers]
  )

  const registerHandler = useCallback((actionId: string, handler: (payload?: unknown) => void) => {
    setCustomHandlers((prev) => ({ ...prev, [actionId]: handler }))
  }, [])

  const unregisterHandler = useCallback((actionId: string) => {
    setCustomHandlers((prev) => {
      const { [actionId]: _, ...rest } = prev
      return rest
    })
  }, [])

  return {
    triggerAction,
    registerHandler,
    unregisterHandler,
  }
}

/**
 * Combined hook result for useTemplate
 */
export interface UseTemplateResult extends UseTemplateStateResult, UseTemplateActionsResult {
  /** The template being used */
  template: PageTemplate
  /** External data passed to the template */
  data: Record<string, unknown>
  /** Set external data */
  setData: (data: Record<string, unknown>) => void
  /** Available fragments */
  fragments: Record<string, TemplateFragment>
}

/**
 * Combined hook for complete template management
 *
 * @param template - The template to use
 * @param options - Configuration options
 * @returns Complete template management utilities
 */
export function useTemplate(
  template: PageTemplate,
  options?: {
    initialState?: Record<string, unknown>
    initialData?: Record<string, unknown>
    fragments?: Record<string, TemplateFragment>
    navigate?: (path: string) => void
  }
): UseTemplateResult {
  const { initialState, initialData, fragments = {}, navigate } = options ?? {}

  // State management
  const stateResult = useTemplateState(template, initialState)

  // External data
  const [data, setData] = useState<Record<string, unknown>>(initialData ?? {})

  // Action management
  const actionsResult = useTemplateActions(template, stateResult.setState, navigate)

  return {
    template,
    data,
    setData,
    fragments,
    ...stateResult,
    ...actionsResult,
  }
}
