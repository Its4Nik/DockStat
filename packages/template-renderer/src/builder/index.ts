/**
 * Template Builder
 *
 * Type-safe utilities for building templates programmatically.
 * Provides a fluent API for creating widgets, templates, and fragments.
 */

import type {
  ActionConfig,
  ActionErrorHandler,
  ActionSuccessHandler,
  LayoutConfig,
  LoaderConfig,
  PageTemplate,
  StateConfig,
  TemplateFragment,
  WidgetActions,
  WidgetBindings,
  WidgetNode,
  WidgetRegistry,
  WidgetType,
} from "../types"

/**
 * Widget builder for creating type-safe widget nodes
 */
export class WidgetBuilder<T extends WidgetType> {
  private node: WidgetNode

  constructor(type: T, props: WidgetRegistry[T]) {
    this.node = {
      type,
      props,
    } as WidgetNode
  }

  /**
   * Set a unique ID for this widget
   */
  id(id: string): this {
    this.node.id = id
    return this
  }

  /**
   * Add child widgets
   */
  children(...children: WidgetNode[]): this {
    this.node.children = children
    return this
  }

  /**
   * Add data bindings
   */
  bindings(bindings: WidgetBindings): this {
    this.node.bindings = bindings
    return this
  }

  /**
   * Add action handlers
   */
  actions(actions: WidgetActions): this {
    this.node.actions = actions
    return this
  }

  /**
   * Add a conditional rendering expression
   */
  condition(expr: string): this {
    this.node.condition = expr
    return this
  }

  /**
   * Add loop rendering
   */
  loop(config: { items: string; itemVar?: string; indexVar?: string; keyExpr?: string }): this {
    this.node.loop = config
    return this
  }

  /**
   * Build the widget node
   */
  build(): WidgetNode {
    return this.node
  }
}

/**
 * Create a widget builder for a specific type
 */
export function widget<T extends WidgetType>(type: T, props: WidgetRegistry[T]): WidgetBuilder<T> {
  return new WidgetBuilder(type, props)
}

/**
 * Shorthand widget creators
 */
export const widgets = {
  badge: (props: WidgetRegistry["badge"]) => widget("badge", props),
  button: (props: WidgetRegistry["button"]) => widget("button", props),
  card: (props: WidgetRegistry["card"]) => widget("card", props),
  cardHeader: (props: WidgetRegistry["cardHeader"]) => widget("cardHeader", props),
  cardBody: (props: WidgetRegistry["cardBody"]) => widget("cardBody", props),
  cardFooter: (props: WidgetRegistry["cardFooter"]) => widget("cardFooter", props),
  divider: (props: WidgetRegistry["divider"]) => widget("divider", props),
  input: (props: WidgetRegistry["input"]) => widget("input", props),
  checkbox: (props: WidgetRegistry["checkbox"]) => widget("checkbox", props),
  checkboxGroup: (props: WidgetRegistry["checkboxGroup"]) => widget("checkboxGroup", props),
  toggle: (props: WidgetRegistry["toggle"]) => widget("toggle", props),
  hoverBubble: (props: WidgetRegistry["hoverBubble"]) => widget("hoverBubble", props),
  link: (props: WidgetRegistry["link"]) => widget("link", props),
  modal: (props: WidgetRegistry["modal"]) => widget("modal", props),
  slider: (props: WidgetRegistry["slider"]) => widget("slider", props),
  slides: (props: WidgetRegistry["slides"]) => widget("slides", props),
  table: (props: WidgetRegistry["table"]) => widget("table", props),
  text: (props: WidgetRegistry["text"]) => widget("text", props),
  container: (props: WidgetRegistry["container"]) => widget("container", props),
} as const

/**
 * Template builder for creating page templates
 */
export class TemplateBuilder {
  private template: PageTemplate

  constructor(id: string, name: string) {
    this.template = {
      id,
      name,
      widgets: [],
    }
  }

  /**
   * Set the template description
   */
  description(desc: string): this {
    this.template.description = desc
    return this
  }

  /**
   * Set the template version
   */
  version(ver: string): this {
    this.template.version = ver
    return this
  }

  /**
   * Set the layout configuration
   */
  layout(config: LayoutConfig): this {
    this.template.layout = config
    return this
  }

  /**
   * Set the initial state
   */
  state(config: StateConfig): this {
    this.template.state = config
    return this
  }

  /**
   * Add actions
   */
  actions(...actions: ActionConfig[]): this {
    this.template.actions = [...(this.template.actions ?? []), ...actions]
    return this
  }

  /**
   * Add widgets
   */
  widgets(...widgetNodes: (WidgetNode | WidgetBuilder<WidgetType>)[]): this {
    const nodes = widgetNodes.map((w) => (w instanceof WidgetBuilder ? w.build() : w))
    this.template.widgets = [...this.template.widgets, ...nodes]
    return this
  }

  /**
   * Set meta information
   */
  meta(meta: PageTemplate["meta"]): this {
    this.template.meta = meta
    return this
  }

  /**
   * Build the template
   */
  build(): PageTemplate {
    return this.template
  }
}

/**
 * Create a template builder
 */
export function template(id: string, name: string): TemplateBuilder {
  return new TemplateBuilder(id, name)
}

/**
 * Fragment builder for creating reusable template fragments
 */
export class FragmentBuilder {
  private fragment: TemplateFragment

  constructor(id: string, name: string) {
    this.fragment = {
      id,
      name,
      widgets: [],
    }
  }

  /**
   * Set the fragment description
   */
  description(desc: string): this {
    this.fragment.description = desc
    return this
  }

  /**
   * Define props schema for this fragment
   */
  props(
    schema: Record<
      string,
      {
        type: "string" | "number" | "boolean" | "object" | "array"
        required?: boolean
        default?: unknown
      }
    >
  ): this {
    this.fragment.props = schema
    return this
  }

  /**
   * Add widgets
   */
  widgets(...widgetNodes: (WidgetNode | WidgetBuilder<WidgetType>)[]): this {
    const nodes = widgetNodes.map((w) => (w instanceof WidgetBuilder ? w.build() : w))
    this.fragment.widgets = [...this.fragment.widgets, ...nodes]
    return this
  }

  /**
   * Build the fragment
   */
  build(): TemplateFragment {
    return this.fragment
  }
}

/**
 * Create a fragment builder
 */
export function fragment(id: string, name: string): FragmentBuilder {
  return new FragmentBuilder(id, name)
}

/**
 * Action builder helpers
 */
export const actions = {
  /**
   * Create a setState action
   */
  setState(id: string, updates: Record<string, unknown>): ActionConfig {
    return {
      id,
      type: "setState",
      stateUpdates: updates,
    }
  },

  /**
   * Create a navigate action
   */
  navigate(id: string, path: string): ActionConfig {
    return {
      id,
      type: "navigate",
      path,
    }
  },

  /**
   * Create a custom action
   */
  custom(id: string, handler: string): ActionConfig {
    return {
      id,
      type: "custom",
      handler,
    }
  },

  /**
   * Create an API action that calls a plugin backend route
   */
  api(
    id: string,
    apiRoute: string,
    options?: {
      method?: "GET" | "POST"
      body?: unknown
      onSuccess?: ActionSuccessHandler
      onError?: ActionErrorHandler
      showLoading?: boolean
      confirm?: { title?: string; message: string; confirmText?: string; cancelText?: string }
      debounce?: number
    }
  ): ActionConfig {
    return {
      id,
      type: "api",
      apiRoute,
      method: options?.method ?? "POST",
      body: options?.body,
      onSuccess: options?.onSuccess,
      onError: options?.onError,
      showLoading: options?.showLoading,
      confirm: options?.confirm,
      debounce: options?.debounce,
    }
  },

  /**
   * Create a reload action that re-executes loaders
   */
  reload(id: string, loaderIds?: string[]): ActionConfig {
    return {
      id,
      type: "reload",
      loaderIds,
    }
  },
} as const

/**
 * Loader builder helpers
 */
export const loaders = {
  /**
   * Create a basic data loader
   */
  data(
    id: string,
    apiRoute: string,
    options?: {
      method?: "GET" | "POST"
      body?: unknown
      stateKey?: string
      dataKey?: string
    }
  ): LoaderConfig {
    return {
      id,
      apiRoute,
      method: options?.method ?? "GET",
      body: options?.body,
      stateKey: options?.stateKey,
      dataKey: options?.dataKey ?? id,
    }
  },

  /**
   * Create a loader that stores data in state
   */
  toState(
    id: string,
    apiRoute: string,
    stateKey: string,
    options?: {
      method?: "GET" | "POST"
      body?: unknown
    }
  ): LoaderConfig {
    return {
      id,
      apiRoute,
      method: options?.method ?? "GET",
      body: options?.body,
      stateKey,
    }
  },

  /**
   * Create a polling loader that refreshes periodically
   */
  polling(
    id: string,
    apiRoute: string,
    interval: number,
    options?: {
      method?: "GET" | "POST"
      body?: unknown
      stateKey?: string
      dataKey?: string
      enabled?: boolean | string
    }
  ): LoaderConfig {
    return {
      id,
      apiRoute,
      method: options?.method ?? "GET",
      body: options?.body,
      stateKey: options?.stateKey,
      dataKey: options?.dataKey ?? id,
      polling: {
        interval,
        enabled: options?.enabled ?? true,
      },
    }
  },

  /**
   * Create a cached loader
   */
  cached(
    id: string,
    apiRoute: string,
    ttl: number,
    options?: {
      method?: "GET" | "POST"
      body?: unknown
      stateKey?: string
      dataKey?: string
      cacheKey?: string
    }
  ): LoaderConfig {
    return {
      id,
      apiRoute,
      method: options?.method ?? "GET",
      body: options?.body,
      stateKey: options?.stateKey,
      dataKey: options?.dataKey ?? id,
      cache: {
        ttl,
        key: options?.cacheKey,
      },
    }
  },
} as const

/**
 * Layout preset configurations
 */
export const layouts = {
  /**
   * Flex column layout
   */
  column(options?: Partial<LayoutConfig>): LayoutConfig {
    return {
      type: "flex",
      direction: "column",
      ...options,
    }
  },

  /**
   * Flex row layout
   */
  row(options?: Partial<LayoutConfig>): LayoutConfig {
    return {
      type: "flex",
      direction: "row",
      ...options,
    }
  },

  /**
   * Grid layout
   */
  grid(columns: number | string, options?: Partial<LayoutConfig>): LayoutConfig {
    return {
      type: "grid",
      columns,
      ...options,
    }
  },

  /**
   * Centered container
   */
  centered(maxWidth?: string | number, options?: Partial<LayoutConfig>): LayoutConfig {
    return {
      type: "block",
      centered: true,
      maxWidth,
      ...options,
    }
  },
} as const
