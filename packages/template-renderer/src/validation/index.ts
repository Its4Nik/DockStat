/**
 * Template Validation System
 *
 * Provides comprehensive validation for JSON/YAML templates
 * with detailed error reporting and type safety.
 */

import type {
  PageTemplate,
  WidgetNode,
  TemplateFragment,
  TemplateValidationResult,
  TemplateValidationError,
  TemplateValidationWarning,
  LayoutConfig,
  ActionConfig,
  StateConfig,
} from "../types"
import { hasWidget, widgetHasChildren, getRegisteredWidgetTypes } from "../registry"
import type { WidgetType } from "../types"

/**
 * Validation context for tracking state during validation
 */
interface ValidationContext {
  errors: TemplateValidationError[]
  warnings: TemplateValidationWarning[]
  path: string[]
  definedActions: Set<string>
  definedStateKeys: Set<string>
  definedFragments: Set<string>
}

/**
 * Create a new validation context
 */
function createContext(): ValidationContext {
  return {
    errors: [],
    warnings: [],
    path: [],
    definedActions: new Set(),
    definedStateKeys: new Set(),
    definedFragments: new Set(),
  }
}

/**
 * Add an error to the context
 */
function addError(
  ctx: ValidationContext,
  code: string,
  message: string,
  additionalContext?: Record<string, unknown>
): void {
  ctx.errors.push({
    code,
    message,
    path: ctx.path.join("."),
    context: additionalContext,
  })
}

/**
 * Add a warning to the context
 */
function addWarning(
  ctx: ValidationContext,
  code: string,
  message: string,
  additionalContext?: Record<string, unknown>
): void {
  ctx.warnings.push({
    code,
    message,
    path: ctx.path.join("."),
    context: additionalContext,
  })
}

/**
 * Push a path segment onto the context
 */
function pushPath(ctx: ValidationContext, segment: string | number): void {
  ctx.path.push(String(segment))
}

/**
 * Pop a path segment from the context
 */
function popPath(ctx: ValidationContext): void {
  ctx.path.pop()
}

/**
 * Validate a required string field
 */
function validateRequiredString(
  ctx: ValidationContext,
  value: unknown,
  fieldName: string
): value is string {
  pushPath(ctx, fieldName)
  try {
    if (value === undefined || value === null) {
      addError(ctx, "REQUIRED_FIELD", `Required field "${fieldName}" is missing`)
      return false
    }
    if (typeof value !== "string") {
      addError(ctx, "INVALID_TYPE", `Field "${fieldName}" must be a string, got ${typeof value}`)
      return false
    }
    if (value.trim() === "") {
      addError(ctx, "EMPTY_STRING", `Field "${fieldName}" cannot be empty`)
      return false
    }
    return true
  } finally {
    popPath(ctx)
  }
}

/**
 * Validate an optional string field
 */
function validateOptionalString(
  ctx: ValidationContext,
  value: unknown,
  fieldName: string
): value is string | undefined {
  if (value === undefined || value === null) {
    return true
  }
  pushPath(ctx, fieldName)
  try {
    if (typeof value !== "string") {
      addError(ctx, "INVALID_TYPE", `Field "${fieldName}" must be a string, got ${typeof value}`)
      return false
    }
    return true
  } finally {
    popPath(ctx)
  }
}

/**
 * Validate a layout configuration
 */
function validateLayout(ctx: ValidationContext, layout: unknown): layout is LayoutConfig {
  if (layout === undefined || layout === null) {
    return true
  }

  pushPath(ctx, "layout")
  try {
    if (typeof layout !== "object" || Array.isArray(layout)) {
      addError(ctx, "INVALID_TYPE", "Layout must be an object")
      return false
    }

    const l = layout as Record<string, unknown>

    // Validate layout type
    if (l.type !== undefined) {
      const validTypes = ["flex", "grid", "block"]
      if (!validTypes.includes(l.type as string)) {
        addError(ctx, "INVALID_LAYOUT_TYPE", `Layout type must be one of: ${validTypes.join(", ")}`)
      }
    }

    // Validate direction
    if (l.direction !== undefined) {
      const validDirections = ["row", "column", "row-reverse", "column-reverse"]
      if (!validDirections.includes(l.direction as string)) {
        addError(
          ctx,
          "INVALID_DIRECTION",
          `Direction must be one of: ${validDirections.join(", ")}`
        )
      }
    }

    return ctx.errors.length === 0
  } finally {
    popPath(ctx)
  }
}

/**
 * Validate an action configuration
 */
function validateAction(
  ctx: ValidationContext,
  action: unknown,
  index: number
): action is ActionConfig {
  pushPath(ctx, index)
  try {
    if (typeof action !== "object" || action === null || Array.isArray(action)) {
      addError(ctx, "INVALID_TYPE", "Action must be an object")
      return false
    }

    const a = action as Record<string, unknown>

    // Validate required fields
    if (!validateRequiredString(ctx, a.id, "id")) {
      return false
    }

    // Check for duplicate IDs
    if (ctx.definedActions.has(a.id as string)) {
      addError(ctx, "DUPLICATE_ID", `Duplicate action ID: "${a.id}"`)
    } else {
      ctx.definedActions.add(a.id as string)
    }

    // Validate type
    const validTypes = ["navigate", "setState", "custom"]
    if (!validateRequiredString(ctx, a.type, "type")) {
      return false
    }
    if (!validTypes.includes(a.type as string)) {
      addError(ctx, "INVALID_ACTION_TYPE", `Action type must be one of: ${validTypes.join(", ")}`)
    }

    // Type-specific validation
    if (a.type === "navigate") {
      if (!a.path) {
        addError(ctx, "MISSING_PATH", "Navigate action requires a path")
      }
    } else if (a.type === "setState") {
      if (!a.stateUpdates || typeof a.stateUpdates !== "object") {
        addError(ctx, "MISSING_STATE_UPDATES", "setState action requires stateUpdates object")
      }
    }

    return true
  } finally {
    popPath(ctx)
  }
}

/**
 * Validate state configuration
 */
function validateState(ctx: ValidationContext, state: unknown): state is StateConfig {
  if (state === undefined || state === null) {
    return true
  }

  pushPath(ctx, "state")
  try {
    if (typeof state !== "object" || Array.isArray(state)) {
      addError(ctx, "INVALID_TYPE", "State must be an object")
      return false
    }

    const s = state as Record<string, unknown>

    // Validate initial state
    if (s.initial !== undefined) {
      if (typeof s.initial !== "object" || Array.isArray(s.initial) || s.initial === null) {
        addError(ctx, "INVALID_INITIAL_STATE", "Initial state must be an object")
      } else {
        // Track defined state keys
        for (const key of Object.keys(s.initial as object)) {
          ctx.definedStateKeys.add(key)
        }
      }
    }

    // Validate computed
    if (s.computed !== undefined) {
      if (typeof s.computed !== "object" || Array.isArray(s.computed) || s.computed === null) {
        addError(ctx, "INVALID_COMPUTED", "Computed must be an object")
      }
    }

    return true
  } finally {
    popPath(ctx)
  }
}

/**
 * Validate a widget node
 */
function validateWidgetNode(
  ctx: ValidationContext,
  node: unknown,
  index: number
): node is WidgetNode {
  pushPath(ctx, index)
  try {
    if (typeof node !== "object" || node === null || Array.isArray(node)) {
      addError(ctx, "INVALID_TYPE", "Widget node must be an object")
      return false
    }

    const n = node as Record<string, unknown>

    // Validate type
    if (!validateRequiredString(ctx, n.type, "type")) {
      return false
    }

    const widgetType = n.type as string
    if (!hasWidget(widgetType)) {
      addError(ctx, "UNKNOWN_WIDGET", `Unknown widget type: "${widgetType}"`, {
        availableTypes: getRegisteredWidgetTypes(),
      })
      return false
    }

    // Validate props
    if (n.props === undefined) {
      addError(ctx, "MISSING_PROPS", "Widget node must have props")
      return false
    }
    if (typeof n.props !== "object" || Array.isArray(n.props) || n.props === null) {
      addError(ctx, "INVALID_PROPS", "Widget props must be an object")
      return false
    }

    // Validate children if present
    if (n.children !== undefined) {
      if (!widgetHasChildren(widgetType as WidgetType)) {
        addWarning(
          ctx,
          "CHILDREN_NOT_SUPPORTED",
          `Widget type "${widgetType}" does not support children`
        )
      }
      if (!validateWidgetNodes(ctx, n.children, "children")) {
        return false
      }
    }

    // Validate bindings
    if (n.bindings !== undefined) {
      if (typeof n.bindings !== "object" || Array.isArray(n.bindings) || n.bindings === null) {
        addError(ctx, "INVALID_BINDINGS", "Bindings must be an object")
      }
    }

    // Validate actions
    if (n.actions !== undefined) {
      if (typeof n.actions !== "object" || Array.isArray(n.actions) || n.actions === null) {
        addError(ctx, "INVALID_ACTIONS", "Actions must be an object")
      } else {
        // Check that referenced actions exist
        const actions = n.actions as Record<string, string>
        for (const [event, actionId] of Object.entries(actions)) {
          if (typeof actionId !== "string") {
            addError(ctx, "INVALID_ACTION_REF", `Action reference for "${event}" must be a string`)
          }
        }
      }
    }

    // Validate condition
    if (n.condition !== undefined && typeof n.condition !== "string") {
      addError(ctx, "INVALID_CONDITION", "Condition must be a string expression")
    }

    // Validate loop
    if (n.loop !== undefined) {
      if (typeof n.loop !== "object" || Array.isArray(n.loop) || n.loop === null) {
        addError(ctx, "INVALID_LOOP", "Loop must be an object")
      } else {
        const loop = n.loop as Record<string, unknown>
        if (!loop.items || typeof loop.items !== "string") {
          addError(ctx, "MISSING_LOOP_ITEMS", "Loop must have an items path string")
        }
      }
    }

    return true
  } finally {
    popPath(ctx)
  }
}

/**
 * Validate an array of widget nodes
 */
function validateWidgetNodes(
  ctx: ValidationContext,
  nodes: unknown,
  fieldName: string
): nodes is WidgetNode[] {
  pushPath(ctx, fieldName)
  try {
    if (!Array.isArray(nodes)) {
      addError(ctx, "INVALID_TYPE", `${fieldName} must be an array`)
      return false
    }

    let valid = true
    for (let i = 0; i < nodes.length; i++) {
      if (!validateWidgetNode(ctx, nodes[i], i)) {
        valid = false
      }
    }

    return valid
  } finally {
    popPath(ctx)
  }
}

/**
 * Validate a template fragment
 */
export function validateFragment(fragment: unknown): TemplateValidationResult {
  const ctx = createContext()

  if (typeof fragment !== "object" || fragment === null || Array.isArray(fragment)) {
    addError(ctx, "INVALID_TYPE", "Template fragment must be an object")
    return { valid: false, errors: ctx.errors, warnings: ctx.warnings }
  }

  const f = fragment as Record<string, unknown>

  // Validate required fields
  validateRequiredString(ctx, f.id, "id")
  validateRequiredString(ctx, f.name, "name")

  // Validate optional fields
  validateOptionalString(ctx, f.description, "description")

  // Validate props schema if present
  if (f.props !== undefined) {
    if (typeof f.props !== "object" || Array.isArray(f.props) || f.props === null) {
      addError(ctx, "INVALID_PROPS_SCHEMA", "Props must be an object")
    }
  }

  // Validate widgets
  if (f.widgets === undefined) {
    addError(ctx, "MISSING_WIDGETS", "Fragment must have widgets array")
  } else {
    validateWidgetNodes(ctx, f.widgets, "widgets")
  }

  return {
    valid: ctx.errors.length === 0,
    errors: ctx.errors.length > 0 ? ctx.errors : undefined,
    warnings: ctx.warnings.length > 0 ? ctx.warnings : undefined,
  }
}

/**
 * Validate a complete page template
 */
export function validateTemplate(template: unknown): TemplateValidationResult {
  const ctx = createContext()

  if (typeof template !== "object" || template === null || Array.isArray(template)) {
    addError(ctx, "INVALID_TYPE", "Template must be an object")
    return { valid: false, errors: ctx.errors, warnings: ctx.warnings }
  }

  const t = template as Record<string, unknown>

  // Validate required fields
  validateRequiredString(ctx, t.id, "id")
  validateRequiredString(ctx, t.name, "name")

  // Validate optional fields
  validateOptionalString(ctx, t.description, "description")
  validateOptionalString(ctx, t.version, "version")

  // Validate layout
  validateLayout(ctx, t.layout)

  // Validate state
  validateState(ctx, t.state)

  // Validate actions
  if (t.actions !== undefined) {
    if (!Array.isArray(t.actions)) {
      addError(ctx, "INVALID_TYPE", "actions must be an array")
    } else {
      pushPath(ctx, "actions")
      for (let i = 0; i < t.actions.length; i++) {
        validateAction(ctx, t.actions[i], i)
      }
      popPath(ctx)
    }
  }

  // Validate widgets
  if (t.widgets === undefined) {
    addError(ctx, "MISSING_WIDGETS", "Template must have widgets array")
  } else {
    validateWidgetNodes(ctx, t.widgets, "widgets")
  }

  // Validate meta
  if (t.meta !== undefined) {
    if (typeof t.meta !== "object" || Array.isArray(t.meta) || t.meta === null) {
      addError(ctx, "INVALID_META", "Meta must be an object")
    }
  }

  return {
    valid: ctx.errors.length === 0,
    errors: ctx.errors.length > 0 ? ctx.errors : undefined,
    warnings: ctx.warnings.length > 0 ? ctx.warnings : undefined,
  }
}

/**
 * Type guard that validates and narrows the type
 */
export function isValidTemplate(template: unknown): template is PageTemplate {
  return validateTemplate(template).valid
}

/**
 * Type guard for template fragments
 */
export function isValidFragment(fragment: unknown): fragment is TemplateFragment {
  return validateFragment(fragment).valid
}

/**
 * Assert that a template is valid, throwing if not
 */
export function assertValidTemplate(template: unknown): asserts template is PageTemplate {
  const result = validateTemplate(template)
  if (!result.valid) {
    const errorMessages = result.errors?.map((e) => `${e.path}: ${e.message}`).join("\n") ?? ""
    throw new Error(`Invalid template:\n${errorMessages}`)
  }
}

/**
 * Assert that a fragment is valid, throwing if not
 */
export function assertValidFragment(fragment: unknown): asserts fragment is TemplateFragment {
  const result = validateFragment(fragment)
  if (!result.valid) {
    const errorMessages = result.errors?.map((e) => `${e.path}: ${e.message}`).join("\n") ?? ""
    throw new Error(`Invalid fragment:\n${errorMessages}`)
  }
}
