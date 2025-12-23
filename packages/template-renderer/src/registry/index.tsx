/**
 * Widget Registry
 *
 * Maps widget type names to their corresponding React components from @dockstat/ui
 * and provides utilities for widget resolution and rendering.
 */

import type { ComponentType, ReactNode } from "react"
import {
  Badge,
  Button,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Divider,
  Input,
  Checkbox,
  CheckboxGroup,
  Toggle,
  HoverBubble,
  LinkWithIcon,
  Modal,
  Slider,
  Slides,
  Table,
} from "@dockstat/ui"
import type { WidgetType, WidgetRegistry as WidgetRegistryType } from "../types"

/**
 * Component wrapper type that accepts serializable props and children
 */
export type WidgetComponent<T extends WidgetType = WidgetType> = ComponentType<
  WidgetRegistryType[T] & { children?: ReactNode }
>

/**
 * Registry entry containing the component and metadata
 */
export interface RegistryEntry<T extends WidgetType = WidgetType> {
  /** The React component to render */
  component: WidgetComponent<T>
  /** Whether this widget can contain children */
  hasChildren: boolean
  /** Default props for this widget */
  defaultProps?: Partial<WidgetRegistryType[T]>
  /** Transform serializable props to component props */
  transformProps?: (
    props: WidgetRegistryType[T],
    context: PropsTransformContext
  ) => Record<string, unknown>
}

/**
 * Context passed to prop transformers
 */
export interface PropsTransformContext {
  /** Resolved data bindings */
  bindings: Record<string, unknown>
  /** Action handler creator */
  createActionHandler: (actionId: string) => (() => void) | undefined
  /** Children ReactNode if any */
  children?: ReactNode
}

/**
 * Text component for rendering simple text content
 */
function Text({
  text,
  className,
  as: Component = "span",
}: {
  text: string
  className?: string
  as?: "p" | "span" | "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "div"
}) {
  return <Component className={className}>{text}</Component>
}

/**
 * Container component for layout purposes
 */
function Container({
  className,
  layout = "block",
  direction = "row",
  gap,
  align,
  justify,
  columns,
  children,
}: {
  className?: string
  layout?: "flex" | "grid" | "block"
  direction?: "row" | "column" | "row-reverse" | "column-reverse"
  gap?: string | number
  align?: "start" | "center" | "end" | "stretch" | "baseline"
  justify?: "start" | "center" | "end" | "between" | "around" | "evenly"
  columns?: number | string
  children?: ReactNode
}) {
  const layoutClasses: Record<string, string> = {
    block: "block",
    flex: "flex",
    grid: "grid",
  }

  const directionClasses: Record<string, string> = {
    row: "flex-row",
    column: "flex-col",
    "row-reverse": "flex-row-reverse",
    "column-reverse": "flex-col-reverse",
  }

  const alignClasses: Record<string, string> = {
    start: "items-start",
    center: "items-center",
    end: "items-end",
    stretch: "items-stretch",
    baseline: "items-baseline",
  }

  const justifyClasses: Record<string, string> = {
    start: "justify-start",
    center: "justify-center",
    end: "justify-end",
    between: "justify-between",
    around: "justify-around",
    evenly: "justify-evenly",
  }

  const classes = [
    layoutClasses[layout],
    layout === "flex" ? directionClasses[direction] : "",
    align ? alignClasses[align] : "",
    justify ? justifyClasses[justify] : "",
    className,
  ]
    .filter(Boolean)
    .join(" ")

  const style: React.CSSProperties = {}
  if (gap !== undefined) {
    style.gap = typeof gap === "number" ? `${gap}px` : gap
  }
  if (layout === "grid" && columns !== undefined) {
    style.gridTemplateColumns =
      typeof columns === "number" ? `repeat(${columns}, minmax(0, 1fr))` : columns
  }

  return (
    <div className={classes} style={style}>
      {children}
    </div>
  )
}

/**
 * Badge wrapper that converts text prop to children
 */
function BadgeWrapper({
  text,
  children,
  ...props
}: {
  text?: string
  children?: ReactNode
} & Omit<Parameters<typeof Badge>[0], "children">) {
  return <Badge {...props}>{text || children}</Badge>
}

/**
 * Button wrapper that converts text prop to children and action to onClick
 */
function ButtonWrapper({
  text,
  action,
  onClick,
  children,
  ...props
}: {
  text?: string
  action?: string
  onClick?: () => void
  children?: ReactNode
} & Omit<Parameters<typeof Button>[0], "children" | "onClick">) {
  return (
    <Button {...props} onClick={onClick}>
      {text || children}
    </Button>
  )
}

/**
 * Card header wrapper that converts text prop to children
 */
function CardHeaderWrapper({
  text,
  children,
  ...props
}: {
  text?: string
  children?: ReactNode
} & Omit<Parameters<typeof CardHeader>[0], "children">) {
  return <CardHeader {...props}>{text || children}</CardHeader>
}

/**
 * Link wrapper that converts text prop to children
 */
function LinkWrapper({
  text,
  icon,
  children,
  ...props
}: {
  text?: string
  icon?: string
  children?: ReactNode
} & Omit<Parameters<typeof LinkWithIcon>[0], "children" | "icon">) {
  // Note: icon prop would need to be resolved to actual icon component
  // For now, we pass undefined if it's a string (icon name)
  return <LinkWithIcon {...props}>{text || children}</LinkWithIcon>
}

/**
 * The main widget registry
 */
const WIDGET_REGISTRY: { [K in WidgetType]: RegistryEntry<K> } = {
  badge: {
    component: BadgeWrapper as unknown as WidgetComponent<"badge">,
    hasChildren: false,
    transformProps: (props, ctx) => ({
      ...props,
      text: ctx.bindings.text ?? props.text,
    }),
  },

  button: {
    component: ButtonWrapper as unknown as WidgetComponent<"button">,
    hasChildren: false,
    transformProps: (props, ctx) => ({
      ...props,
      text: ctx.bindings.text ?? props.text,
      onClick: props.action ? ctx.createActionHandler(props.action) : undefined,
    }),
  },

  card: {
    component: Card as unknown as WidgetComponent<"card">,
    hasChildren: true,
    transformProps: (props, ctx) => ({
      ...props,
      children: ctx.children,
      onClick: props.action ? ctx.createActionHandler(props.action) : undefined,
    }),
  },

  cardHeader: {
    component: CardHeaderWrapper as unknown as WidgetComponent<"cardHeader">,
    hasChildren: true,
    transformProps: (props, ctx) => ({
      ...props,
      text: ctx.bindings.text ?? props.text,
      children: ctx.children,
    }),
  },

  cardBody: {
    component: CardBody as unknown as WidgetComponent<"cardBody">,
    hasChildren: true,
    transformProps: (props, ctx) => ({
      ...props,
      children: ctx.children,
    }),
  },

  cardFooter: {
    component: CardFooter as unknown as WidgetComponent<"cardFooter">,
    hasChildren: true,
    transformProps: (props, ctx) => ({
      ...props,
      children: ctx.children,
    }),
  },

  divider: {
    component: Divider as unknown as WidgetComponent<"divider">,
    hasChildren: false,
    transformProps: (props, ctx) => ({
      ...props,
      label: ctx.bindings.label ?? props.label,
    }),
  },

  input: {
    component: Input as unknown as WidgetComponent<"input">,
    hasChildren: false,
    transformProps: (props, ctx) => ({
      ...props,
      value: ctx.bindings.value as string | undefined,
      onChange: ctx.bindings.onChange as ((value: string) => void) | undefined,
    }),
  },

  checkbox: {
    component: Checkbox as unknown as WidgetComponent<"checkbox">,
    hasChildren: false,
    transformProps: (props, ctx) => ({
      ...props,
      checked: ctx.bindings.checked as boolean | undefined,
      onChange: ctx.bindings.onChange as ((checked: boolean) => void) | undefined,
    }),
  },

  checkboxGroup: {
    component: CheckboxGroup as unknown as WidgetComponent<"checkboxGroup">,
    hasChildren: false,
    transformProps: (props, ctx) => ({
      ...props,
      selectedValues: (ctx.bindings.selectedValues as string[]) ?? [],
      onChange: ctx.bindings.onChange as ((values: string[]) => void) | undefined,
    }),
  },

  toggle: {
    component: Toggle as unknown as WidgetComponent<"toggle">,
    hasChildren: false,
    transformProps: (props, ctx) => ({
      ...props,
      checked: ctx.bindings.checked as boolean | undefined,
      onChange: ctx.bindings.onChange as ((checked: boolean) => void) | undefined,
    }),
  },

  hoverBubble: {
    component: HoverBubble as unknown as WidgetComponent<"hoverBubble">,
    hasChildren: true,
    transformProps: (props, ctx) => ({
      ...props,
      label: ctx.bindings.label ?? props.label,
      children: ctx.children,
    }),
  },

  link: {
    component: LinkWrapper as unknown as WidgetComponent<"link">,
    hasChildren: false,
    transformProps: (props, ctx) => ({
      ...props,
      href: (ctx.bindings.href as string) ?? props.href,
      text: ctx.bindings.text ?? props.text,
    }),
  },

  modal: {
    component: Modal as unknown as WidgetComponent<"modal">,
    hasChildren: true,
    transformProps: (props, ctx) => ({
      ...props,
      open: ctx.bindings.open as boolean | undefined,
      onClose: ctx.bindings.onClose as (() => void) | undefined,
      children: ctx.children,
    }),
  },

  slider: {
    component: Slider as unknown as WidgetComponent<"slider">,
    hasChildren: false,
    transformProps: (props, ctx) => ({
      ...props,
      value: ctx.bindings.value as number | undefined,
      onChange: ctx.bindings.onChange as ((value: number) => void) | undefined,
    }),
  },

  slides: {
    component: Slides as unknown as WidgetComponent<"slides">,
    hasChildren: true,
    transformProps: (props, ctx) => ({
      ...props,
      selectedSlide: ctx.bindings.selectedSlide as string | undefined,
      onSlideChange: ctx.bindings.onSlideChange as ((slide: string | null) => void) | undefined,
      children: ctx.children,
    }),
  },

  table: {
    component: Table as unknown as WidgetComponent<"table">,
    hasChildren: false,
    transformProps: (props, ctx) => ({
      ...props,
      data: (ctx.bindings.data as Record<string, unknown>[]) ?? [],
      columns: props.columns.map((col) => ({
        key: col.key,
        title: col.title,
        width: col.width,
        align: col.align,
        sortable: col.sortable,
        filterable: col.filterable,
      })),
    }),
  },

  text: {
    component: Text as unknown as WidgetComponent<"text">,
    hasChildren: false,
    transformProps: (props, ctx) => ({
      ...props,
      text: (ctx.bindings.text as string) ?? props.text,
    }),
  },

  container: {
    component: Container as unknown as WidgetComponent<"container">,
    hasChildren: true,
    transformProps: (props, ctx) => ({
      ...props,
      children: ctx.children,
    }),
  },
}

/**
 * Get the registry entry for a widget type
 */
export function getWidgetEntry<T extends WidgetType>(type: T): RegistryEntry<T> | undefined {
  return WIDGET_REGISTRY[type] as RegistryEntry<T> | undefined
}

/**
 * Get the component for a widget type
 */
export function getWidgetComponent<T extends WidgetType>(type: T): WidgetComponent<T> | undefined {
  return WIDGET_REGISTRY[type]?.component as WidgetComponent<T> | undefined
}

/**
 * Check if a widget type exists in the registry
 */
export function hasWidget(type: string): type is WidgetType {
  return type in WIDGET_REGISTRY
}

/**
 * Get all registered widget types
 */
export function getRegisteredWidgetTypes(): WidgetType[] {
  return Object.keys(WIDGET_REGISTRY) as WidgetType[]
}

/**
 * Check if a widget type supports children
 */
export function widgetHasChildren(type: WidgetType): boolean {
  return WIDGET_REGISTRY[type]?.hasChildren ?? false
}

export { WIDGET_REGISTRY }
