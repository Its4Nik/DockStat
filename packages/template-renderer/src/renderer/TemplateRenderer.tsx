/**
 * Template Renderer
 *
 * The main React component that renders a PageTemplate into actual UI components.
 * Handles widget resolution, data binding, action dispatch, and recursive rendering.
 */

import React, { useMemo, useCallback, createContext, useContext, type ReactNode } from "react"
import type {
  PageTemplate,
  WidgetNode,
  TemplateFragment,
  TemplateRenderContext,
  LayoutConfig,
} from "../types"
import { getWidgetEntry, type PropsTransformContext } from "../registry"
import type { WidgetType, WidgetBindings } from "../types"
import { isFragmentReference } from "../types/template"

/**
 * Context for template rendering
 */
const TemplateContext = createContext<TemplateRenderContext | null>(null)

/**
 * Hook to access the template render context
 */
export function useTemplateContext(): TemplateRenderContext {
  const ctx = useContext(TemplateContext)
  if (!ctx) {
    throw new Error("useTemplateContext must be used within a TemplateRenderer")
  }
  return ctx
}

/**
 * Props for the TemplateRenderer component
 */
export interface TemplateRendererProps {
  /** The template to render */
  template: PageTemplate
  /** Current state values */
  state?: Record<string, unknown>
  /** External data passed to the template */
  data?: Record<string, unknown>
  /** Function to update state */
  onStateChange?: (updates: Record<string, unknown>) => void
  /** Function to trigger a custom action */
  onAction?: (actionId: string, payload?: unknown) => void
  /** Function to navigate to a route */
  onNavigate?: (path: string) => void
  /** Available fragments for reference resolution */
  fragments?: Record<string, TemplateFragment>
  /** Plugin context for plugin-specific data */
  pluginContext?: {
    pluginId: number
    pluginName: string
  }
  /** Additional class name for the root container */
  className?: string
}

/**
 * Get a value from a nested object using a dot-notation path
 */
function getValueByPath(obj: Record<string, unknown>, path: string): unknown {
  const parts = path.split(".")
  let current: unknown = obj

  for (const part of parts) {
    if (current === null || current === undefined) {
      return undefined
    }
    if (typeof current !== "object") {
      return undefined
    }
    current = (current as Record<string, unknown>)[part]
  }

  return current
}

/**
 * Resolve bindings for a widget node
 */
function resolveBindings(
  bindings: WidgetBindings | undefined,
  state: Record<string, unknown>,
  data: Record<string, unknown>,
  loopContext?: { item: unknown; index: number; itemVar: string; indexVar: string }
): Record<string, unknown> {
  if (!bindings) {
    return {}
  }

  const resolved: Record<string, unknown> = {}
  const combined = { ...state, ...data }

  // Add loop context if present
  if (loopContext) {
    combined[loopContext.itemVar] = loopContext.item
    combined[loopContext.indexVar] = loopContext.index
  }

  for (const [propName, path] of Object.entries(bindings)) {
    resolved[propName] = getValueByPath(combined, path)
  }

  return resolved
}

/**
 * Evaluate a condition expression
 */
function evaluateCondition(
  condition: string | undefined,
  state: Record<string, unknown>,
  data: Record<string, unknown>,
  loopContext?: { item: unknown; index: number; itemVar: string; indexVar: string }
): boolean {
  if (!condition) {
    return true
  }

  try {
    // Create a safe evaluation context
    const combined = { ...state, ...data }
    if (loopContext) {
      combined[loopContext.itemVar] = loopContext.item
      combined[loopContext.indexVar] = loopContext.index
    }

    // Simple expression evaluation (only supports basic paths and comparisons)
    // For security, we use a simple parser instead of eval

    // Handle simple path access (e.g., "data.isVisible")
    if (
      !condition.includes("===") &&
      !condition.includes("!==") &&
      !condition.includes("&&") &&
      !condition.includes("||")
    ) {
      const value = getValueByPath(combined, condition)
      return Boolean(value)
    }

    // Handle equality checks
    if (condition.includes("===")) {
      const [left, right] = condition.split("===").map((s) => s.trim())
      const leftValue = getValueByPath(combined, left)
      const rightValue =
        right.startsWith("'") || right.startsWith('"')
          ? right.slice(1, -1)
          : (getValueByPath(combined, right) ?? right)
      return leftValue === rightValue
    }

    if (condition.includes("!==")) {
      const [left, right] = condition.split("!==").map((s) => s.trim())
      const leftValue = getValueByPath(combined, left)
      const rightValue =
        right.startsWith("'") || right.startsWith('"')
          ? right.slice(1, -1)
          : (getValueByPath(combined, right) ?? right)
      return leftValue !== rightValue
    }

    // Default to true for unhandled expressions
    return true
  } catch {
    console.warn(`Failed to evaluate condition: ${condition}`)
    return true
  }
}

/**
 * Get layout styles from config
 */
function getLayoutStyles(layout?: LayoutConfig): React.CSSProperties {
  if (!layout) {
    return {}
  }

  const styles: React.CSSProperties = {}

  if (layout.gap !== undefined) {
    styles.gap = typeof layout.gap === "number" ? `${layout.gap}px` : layout.gap
  }

  if (layout.padding !== undefined) {
    styles.padding = typeof layout.padding === "number" ? `${layout.padding}px` : layout.padding
  }

  if (layout.maxWidth !== undefined) {
    styles.maxWidth = typeof layout.maxWidth === "number" ? `${layout.maxWidth}px` : layout.maxWidth
  }

  if (layout.centered) {
    styles.marginLeft = "auto"
    styles.marginRight = "auto"
  }

  if (layout.type === "grid") {
    if (layout.columns !== undefined) {
      styles.gridTemplateColumns =
        typeof layout.columns === "number"
          ? `repeat(${layout.columns}, minmax(0, 1fr))`
          : layout.columns
    }
    if (layout.rows !== undefined) {
      styles.gridTemplateRows =
        typeof layout.rows === "number" ? `repeat(${layout.rows}, minmax(0, 1fr))` : layout.rows
    }
  }

  return styles
}

/**
 * Get layout class names from config
 */
function getLayoutClasses(layout?: LayoutConfig): string {
  if (!layout) {
    return ""
  }

  const classes: string[] = []

  if (layout.className) {
    classes.push(layout.className)
  }

  if (layout.type === "flex") {
    classes.push("flex")
    if (layout.direction) {
      const directionMap: Record<string, string> = {
        row: "flex-row",
        column: "flex-col",
        "row-reverse": "flex-row-reverse",
        "column-reverse": "flex-col-reverse",
      }
      classes.push(directionMap[layout.direction] || "")
    }
  } else if (layout.type === "grid") {
    classes.push("grid")
  }

  return classes.filter(Boolean).join(" ")
}

/**
 * Widget renderer component
 */
interface WidgetRendererProps {
  node: WidgetNode
  loopContext?: { item: unknown; index: number; itemVar: string; indexVar: string }
}

function WidgetRenderer({ node, loopContext }: WidgetRendererProps): React.ReactElement | null {
  const ctx = useTemplateContext()

  // Create action handler factory - must be called before any conditional returns
  const createActionHandler = useCallback(
    (actionId: string) => {
      if (!ctx.triggerAction) {
        return undefined
      }
      return () => ctx.triggerAction(actionId)
    },
    [ctx.triggerAction]
  )

  // Check condition
  const shouldRender = evaluateCondition(node.condition, ctx.state, ctx.data, loopContext)
  if (!shouldRender) {
    return null
  }

  // Handle loop rendering
  if (node.loop && !loopContext) {
    const items = getValueByPath({ ...ctx.state, ...ctx.data }, node.loop.items)
    if (!Array.isArray(items)) {
      console.warn(`Loop items path "${node.loop.items}" did not resolve to an array`)
      return null
    }

    const itemVar = node.loop.itemVar ?? "item"
    const indexVar = node.loop.indexVar ?? "index"

    return (
      <>
        {items.map((item, index) => {
          const key = node.loop?.keyExpr
            ? String(getValueByPath({ [itemVar]: item, [indexVar]: index }, node.loop.keyExpr))
            : `${node.id ?? node.type}-${index}`

          return (
            <WidgetRenderer
              key={key}
              node={{ ...node, loop: undefined }}
              loopContext={{ item, index, itemVar, indexVar }}
            />
          )
        })}
      </>
    )
  }

  // Get the widget entry from registry
  const entry = getWidgetEntry(node.type as WidgetType)
  if (!entry) {
    console.warn(`Unknown widget type: ${node.type}`)
    return null
  }

  // Resolve bindings
  const resolvedBindings = resolveBindings(node.bindings, ctx.state, ctx.data, loopContext)

  // Render children if present
  let children: ReactNode | undefined
  if (node.children && node.children.length > 0) {
    children = node.children.map((childNode, index) => (
      <WidgetRenderer
        key={childNode.id ?? `${childNode.type}-${index}`}
        node={childNode}
        loopContext={loopContext}
      />
    ))
  }

  // Transform props
  const transformContext: PropsTransformContext = {
    bindings: resolvedBindings,
    createActionHandler,
    children,
  }

  const transformedProps = entry.transformProps
    ? entry.transformProps(
        node.props as Parameters<typeof entry.transformProps>[0],
        transformContext
      )
    : { ...node.props, children }

  // Get the component
  const Component = entry.component

  return <Component {...transformedProps} />
}

/**
 * Fragment renderer component
 */
interface FragmentRendererProps {
  fragmentId: string
  props?: Record<string, unknown>
}

function FragmentRenderer({
  fragmentId,
  props: _props,
}: FragmentRendererProps): React.ReactElement | null {
  const ctx = useTemplateContext()

  const fragment = ctx.fragments?.[fragmentId]
  if (!fragment) {
    console.warn(`Fragment not found: ${fragmentId}`)
    return null
  }

  return (
    <>
      {fragment.widgets.map((node, index) => (
        <WidgetRenderer key={node.id ?? `${node.type}-${index}`} node={node} />
      ))}
    </>
  )
}

/**
 * Main TemplateRenderer component
 */
export function TemplateRenderer({
  template,
  state = {},
  data = {},
  onStateChange,
  onAction,
  onNavigate,
  fragments,
  pluginContext,
  className,
}: TemplateRendererProps): React.ReactElement {
  // Merge initial state with provided state
  const mergedState = useMemo(() => {
    return { ...template.state?.initial, ...state }
  }, [template.state?.initial, state])

  // Create state update handler
  const setState = useCallback(
    (updates: Record<string, unknown>) => {
      onStateChange?.(updates)
    },
    [onStateChange]
  )

  // Create action trigger handler
  const triggerAction = useCallback(
    (actionId: string, payload?: unknown): void => {
      // Check if there's an external action handler
      if (onAction) {
        onAction(actionId, payload)
        return
      }

      // Handle built-in action types from template
      const action = template.actions?.find((a) => a.id === actionId)
      if (!action) {
        console.warn(`Action not found: ${actionId}`)
        return
      }

      switch (action.type) {
        case "setState":
          if (action.stateUpdates) {
            setState(action.stateUpdates)
          }
          break
        case "navigate":
          if (action.path && onNavigate) {
            onNavigate(action.path)
          }
          break
        case "custom":
          console.warn(`Custom action "${actionId}" requires onAction handler`)
          break
      }
    },
    [onAction, template.actions, setState, onNavigate]
  )

  // Create navigate handler
  const navigate = useCallback(
    (path: string) => {
      onNavigate?.(path)
    },
    [onNavigate]
  )

  // Build the render context
  const renderContext: TemplateRenderContext = useMemo(
    () => ({
      state: mergedState,
      data,
      setState,
      triggerAction,
      navigate,
      fragments,
      pluginContext,
    }),
    [mergedState, data, setState, triggerAction, navigate, fragments, pluginContext]
  )

  // Get layout configuration
  const layoutClasses = getLayoutClasses(template.layout)
  const layoutStyles = getLayoutStyles(template.layout)

  return (
    <TemplateContext.Provider value={renderContext}>
      <div
        className={`template-renderer ${layoutClasses} ${className ?? ""}`}
        style={layoutStyles}
        data-template-id={template.id}
      >
        {template.widgets.map((node, index) => {
          // Check if it's a fragment reference (cast to TemplateNode for type checking)
          const templateNode = node as Parameters<typeof isFragmentReference>[0]
          if (isFragmentReference(templateNode)) {
            return (
              <FragmentRenderer
                key={templateNode.fragmentId}
                fragmentId={templateNode.fragmentId}
                props={templateNode.props}
              />
            )
          }

          return <WidgetRenderer key={node.id ?? `${node.type}-${index}`} node={node} />
        })}
      </div>
    </TemplateContext.Provider>
  )
}

export default TemplateRenderer
